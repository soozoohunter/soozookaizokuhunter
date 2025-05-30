# python-vector-service/app.py
import os
import io
import sqlite3
import requests
import base64
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

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

# 环境变量
BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")

# Collection 配置
IMAGE_COLLECTION_NAME = "image_collection"
DIM_IMAGE = 512

# SQLite 路径
DB_PATH = os.path.join(os.path.dirname(__file__), "sqlite_db", "sources.db")

# FastAPI & Celery
app = FastAPI(title="Suzoo Vector Service")
celery_app = Celery("celery_client", broker=BROKER_URL, backend=RESULT_BACKEND)

# Pydantic 模型
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

# 本地缓存：等客户端第一次调用时才初始化 Milvus & Collection
collection = None

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
    # 只做 SQLite 初始化，快速返回
    init_db()

# Helper：懒连接 Milvus
def get_collection():
    global collection
    if collection is not None:
        return collection

    # 1) 连接 Milvus
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    # 2) 创建或加载 Collection
    if not utility.has_collection(IMAGE_COLLECTION_NAME):
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="url", dtype=DataType.VARCHAR, max_length=300),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
        ]
        schema = CollectionSchema(fields, description="Store CLIP embeddings of images.")
        coll = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
        coll.create_index(
            field_name="embedding",
            index_params={"index_type":"IVF_FLAT","metric_type":"IP","params":{"nlist":256}}
        )
        coll.load()
    else:
        coll = Collection(IMAGE_COLLECTION_NAME)
        coll.load()

    collection = coll
    return collection

# 加载模型
text_model = SentenceTransformer('all-MiniLM-L6-v2')
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

@app.post("/api/v1/text-embed")
def text_embed(req: TextEmbedRequest):
    vec = text_model.encode([req.text])
    return {"embedding": vec[0].tolist()}

@app.post("/api/v1/image-embed")
def image_embed(req: ImageEmbedRequest):
    try:
        resp = requests.get(req.image_url, timeout=10)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            feat = clip_model.get_image_features(**inputs)[0]
        return {"embedding": feat.cpu().numpy().tolist()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/image-search")
def image_search(req: ImageSearchRequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="Must provide image_url or image_base64")
    try:
        # 取得原始 bytes
        if req.image_url:
            resp = requests.get(req.image_url, timeout=10); resp.raise_for_status()
            img_bytes = resp.content
        else:
            img_bytes = base64.b64decode(req.image_base64)

        # CLIP 编码
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            qv = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        # 搜索
        coll = get_collection()
        results = coll.search(
            data=[qv], anns_field="embedding",
            param={"metric_type":"IP","params":{"nprobe":32}},
            limit=req.top_k, output_fields=["url"]
        )
        hits = [{"url":h.entity.get("url"), "score":float(h.distance)} for h in results[0]]
        return {"results": hits}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Search error: {e}")

@app.post("/api/v1/image-insert")
def image_insert(req: InsertImageRequest):
    try:
        resp = requests.get(req.image_url, timeout=10); resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            v = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        coll = get_collection()
        res = coll.insert([[None], [req.image_url], [v]])
        coll.flush()
        return {"status":"ok", "insert_count": len(res.primary_keys)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insert error: {e}")

@app.post("/api/v1/source/add-url")
def add_url(item: URLItem):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO pending_urls (url) VALUES (?)", (item.url,))
    rid = cur.lastrowid
    conn.commit(); cur.close(); conn.close()

    celery_app.send_task("tasks.crawl_url", args=[rid, item.url])
    return {"status":"OK", "message":f"已寫入DB並派給Celery => {item.url}", "record_id": rid}
