from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import Optional
import requests, io
from PIL import Image

# CLIP 模型
import torch
from transformers import CLIPProcessor, CLIPModel

# Milvus
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

import os

app = FastAPI()

# -----------------------
# 連線到 Milvus
# -----------------------
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")
connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

# 定義圖片向量集合
IMAGE_COLLECTION_NAME = "image_collection"
DIM_IMAGE = 512  # CLIP base=512
if not utility.has_collection(IMAGE_COLLECTION_NAME):
    fields = [
        FieldSchema(name="id",        dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="url",       dtype=DataType.VARCHAR, max_length=300),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
    ]
    schema = CollectionSchema(fields, description="Store CLIP embeddings of images.")
    collection = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
    collection.create_index(
        field_name="embedding",
        index_params={
            "index_type": "IVF_FLAT",   # 也可 IVF_SQ8 / HNSW...
            "metric_type": "IP",
            "params": {"nlist": 256}
        }
    )
    collection.load()
else:
    collection = Collection(IMAGE_COLLECTION_NAME)
    collection.load()

# sentence-transformers (文字)
text_model = SentenceTransformer('all-MiniLM-L6-v2')

# CLIP 模型 (圖片)
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# -----------------------
# Request 模型
# -----------------------
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

# -----------------------
# 1) 文字嵌入
# -----------------------
@app.post("/api/v1/text-embed")
def text_embed(req: TextEmbedRequest):
    vec = text_model.encode([req.text])
    return {"embedding": vec[0].tolist()}

# -----------------------
# 2) 圖片嵌入
# -----------------------
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
        raise HTTPException(status_code=400, detail=f"Download or embed error: {e}")

# -----------------------
# 3) 圖片相似搜尋
# -----------------------
@app.post("/api/v1/image-search")
def image_search(req: ImageSearchRequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="Must provide image_url or image_base64")

    # 下載/解碼 圖片 → CLIP 向量
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
            features = clip_model.get_image_features(**inputs)
        query_vec = features[0].cpu().numpy().tolist()

        # 在 Milvus 搜索
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

# -----------------------
# (可選) 插入圖片到 Milvus
# -----------------------
@app.post("/api/v1/image-insert")
def image_insert(req: InsertImageRequest):
    try:
        resp = requests.get(req.image_url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content

        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        inputs = clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            features = clip_model.get_image_features(**inputs)
        vec = features[0].cpu().numpy().tolist()

        insert_res = collection.insert([
            [None],            # auto_id
            [req.image_url],   # url
            [vec],             # embedding
        ])
        collection.flush()
        return {"status": "ok", "insert_count": len(insert_res.primary_keys)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insert error: {e}")
