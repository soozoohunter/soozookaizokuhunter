import os
import io
import sqlite3
import requests

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional

from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

from pymilvus import (
    connections, FieldSchema, CollectionSchema,
    DataType, Collection, utility
)

# Celery Client
from celery import Celery

# 取得 broker/backend
BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")
celery_app = Celery("celery_client", broker=BROKER_URL, backend=RESULT_BACKEND)

app = FastAPI(title="Suzoo Vector Service with Celery & Milvus")

# 連線 Milvus
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")
connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

IMAGE_COLLECTION_NAME = "image_collection"
DIM_IMAGE = 512

# 若集合不存在，則建立
if not utility.has_collection(IMAGE_COLLECTION_NAME):
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="url", dtype=DataType.VARCHAR, max_length=300),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
    ]
    schema = CollectionSchema(fields, description="Store CLIP embeddings of images.")
    collection = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
    collection.create_index(
        field_name="embedding",
        index_params={
            "index_type": "IVF_FLAT",
            "metric_type": "IP",
            "params": {"nlist": 256}
        }
    )
    collection.load()
else:
    collection = Collection(IMAGE_COLLECTION_NAME)
    collection.load()

# 初始化 CLIP & SentenceTransformer
text_model = SentenceTransformer('all-MiniLM-L6-v2')
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# SQLite DB path
DB_PATH = os.path.join(os.path.dirname(__file__), "sqlite_db", "sources.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
    CREATE TABLE IF NOT EXISTS pending_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        status INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()
    conn.close()

@app.on_event("startup")
def on_startup():
    init_db()

class TextEmbedRequest(BaseModel):
    text: str

class ImageEmbedRequest(BaseModel):
    image_url: str

class ImageSearchRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    top_k: int = 5

class InsertImageRequest(BaseModel):
    image_url: str

class URLItem(BaseModel):
    url: HttpUrl

@app.post("/api/v1/text-embed")
def text_embed(req: TextEmbedRequest):
    vec = text_model.encode([req.text])
    return {"embedding": vec[0].tolist()}

@app.post("/api/v1/image-embed")
def image_embed(req: ImageEmbedRequest):
    try:
        resp = requests.get(req.image_url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            features = clip_model.get_image_features(**inputs)
        vec = features[0].cpu().numpy().tolist()
        return {"embedding": vec}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/image-search")
def image_search(req: ImageSearchRequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="Must provide image_url or image_base64")

    try:
        if req.image_url:
            resp = requests.get(req.image_url, timeout=10)
            resp.raise_for_status()
            img_bytes = resp.content
        else:
            import base64
            img_bytes = base64.b64decode(req.image_base64)

        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            query_vec = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        results = collection.search(
            data=[query_vec],
            anns_field="embedding",
            param={"metric_type": "IP", "params": {"nprobe": 32}},
            limit=req.top_k,
            output_fields=["url"]
        )
        hits = []
        for hit in results[0]:
            hits.append({
                "url": hit.entity.get("url"),
                "score": float(hit.distance)
            })
        return {"results": hits}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Search error: {e}")

@app.post("/api/v1/image-insert")
def image_insert(req: InsertImageRequest):
    try:
        resp = requests.get(req.image_url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            vec = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        insert_res = collection.insert([
            [None],
            [req.image_url],
            [vec],
        ])
        collection.flush()
        return {"status": "ok", "insert_count": len(insert_res.primary_keys)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insert error: {e}")

@app.post("/api/v1/source/add-url")
def add_url(item: URLItem):
    """
    1) 插入 pending_urls (status=0)
    2) 立刻呼叫 Celery => tasks.crawl_url(record_id, item.url)
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO pending_urls (url) VALUES (?)", (item.url,))
    record_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()

    # 呼叫 Celery Worker
    celery_app.send_task("tasks.crawl_url", args=[record_id, item.url])

    return {
        "status": "OK",
        "message": f"已寫入DB並派給Celery => {item.url}",
        "record_id": record_id
    }
