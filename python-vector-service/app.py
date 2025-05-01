from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import Optional
import requests, io
from PIL import Image

# 用於圖片向量嵌入(例如 CLIP)
import torch
from transformers import CLIPProcessor, CLIPModel

# ========== Milvus 相關 ==========
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

import os

app = FastAPI()

# -----------------------
# 連線到 Milvus (host/port 由 docker-compose env 指定)
# -----------------------
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")

connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

# 建立 (或使用) 一個 Collection 來存圖片 embedding
IMAGE_COLLECTION_NAME = "image_collection"
DIM_IMAGE = 512  # CLIP base default = 512
if not utility.has_collection(IMAGE_COLLECTION_NAME):
    fields = [
        FieldSchema(name="id",          dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="url",         dtype=DataType.VARCHAR, max_length=300),
        FieldSchema(name="embedding",   dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
    ]
    schema = CollectionSchema(fields, description="Store CLIP embeddings of images.")
    collection = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
    # create index
    collection.create_index(
        field_name="embedding",
        index_params={
            "index_type": "IVF_FLAT",   # IVF_SQ8 / HNSW ...
            "metric_type": "IP",       # inner product
            "params": {"nlist": 256}
        }
    )
    collection.load()
else:
    collection = Collection(IMAGE_COLLECTION_NAME)
    collection.load()

# sentence-transformers (原先文字嵌入)
text_model = SentenceTransformer('all-MiniLM-L6-v2')

# CLIP 模型 (圖片用)
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# -----------------------
# Pydantic 模型
# -----------------------
class EmbedRequest(BaseModel):
    text: str

class ImageEmbedRequest(BaseModel):
    image_url: str

class ImageSearchRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    top_k: int = 5

# -----------------------
# 1) 文字嵌入 API (原封不動)
# -----------------------
@app.post("/api/v1/text-embed")
def embed_text(req: EmbedRequest):
    embeddings = text_model.encode([req.text])
    return {"embedding": embeddings[0].tolist()}

# -----------------------
# 2) 圖片嵌入 API (使用 CLIP)
# -----------------------
@app.post("/api/v1/image-embed")
def embed_image(req: ImageEmbedRequest):
    url = req.image_url
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content
        # 進行 CLIP embedding
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
        vector = image_features[0].cpu().numpy().tolist()
        return {"embedding": vector}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download or embed error: {e}")

# -----------------------
# 3) 圖片相似搜尋 API
#    - 先下載/轉成 embedding
#    - 在 Milvus 搜 top_k
# -----------------------
@app.post("/api/v1/image-search")
def image_search(req: ImageSearchRequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="You must provide either image_url or image_base64")

    # 取得查詢 embedding
    try:
        if req.image_url:
            resp = requests.get(req.image_url, timeout=10)
            resp.raise_for_status()
            img_bytes = resp.content
        else:
            # 若要支援 base64 方式, 這裡自行解碼
            import base64
            img_bytes = base64.b64decode(req.image_base64)

        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
        query_vector = image_features[0].cpu().numpy().tolist()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download or embed error: {e}")

    # Milvus search
    search_results = collection.search(
        data=[query_vector],
        anns_field="embedding",
        param={"metric_type": "IP", "params":{"nprobe":32}},
        limit=req.top_k,
        output_fields=["url"]
    )

    # 整理回傳
    hits = []
    for hit in search_results[0]:
        hits.append({
            "url": hit.entity.get("url"),
            "score": float(hit.distance)
        })
    return {"results": hits}

# -----------------------
# (Optional) 插入圖片到 Milvus
# -----------------------
class InsertImageRequest(BaseModel):
    image_url: str

@app.post("/api/v1/image-insert")
def image_insert(req: InsertImageRequest):
    """下載該圖片 -> 產生embedding -> 插入 Milvus"""
    try:
        resp = requests.get(req.image_url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content

        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
        vector = image_features[0].cpu().numpy().tolist()

        # 插入
        insert_res = collection.insert([
            [None],             # id (auto_id)
            [req.image_url],    # url
            [vector],           # embedding
        ])
        collection.flush()
        return {"status": "ok", "insert_count": len(insert_res.primary_keys)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insert error: {e}")
