# python-vector-service/app.py (最終統一API修正版)

import os
import io
import logging
from typing import Optional

# 引入 FastAPI 的必要工具
from fastapi import FastAPI, HTTPException, APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

from pymilvus import (
    connections, FieldSchema, CollectionSchema,
    DataType, Collection, utility
)

# 日誌設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 环境变量
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")

# Collection 配置
IMAGE_COLLECTION_NAME = "image_collection_v2" # 使用新名稱以避免與舊 schema 衝突
DIM_IMAGE = 512

# FastAPI 應用
app = FastAPI(title="Suzoo Vector Service")
router = APIRouter(prefix="/api/v1")


# ========== 服務與模型初始化 ==========
collection = None
def get_collection():
    global collection
    if collection is not None:
        try:
            # 簡單檢查連線是否健康
            if utility.has_collection(IMAGE_COLLECTION_NAME, using='default'):
                return collection
            else: # Collection 被意外刪除
                logger.warning(f"Collection {IMAGE_COLLECTION_NAME} no longer exists. Re-initializing...")
                collection = None # 強制重新初始化
        except Exception:
            logger.warning("Milvus connection lost. Reconnecting...")
            collection = None # 強制重新初始化

    # 如果 collection 是 None, 則進行初始化
    try:
        logger.info(f"Connecting to Milvus at {MILVUS_HOST}:{MILVUS_PORT}...")
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT, timeout=20)
        
        if not utility.has_collection(IMAGE_COLLECTION_NAME):
            logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' not found. Creating...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=255, is_primary=True),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
            ]
            schema = CollectionSchema(fields, description="Stores CLIP embeddings of images.")
            coll = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
            index_params = {"index_type":"IVF_FLAT", "metric_type":"IP", "params":{"nlist":1024}}
            coll.create_index(field_name="embedding", index_params=index_params)
            logger.info("Index created successfully.")
        else:
            logger.info(f"Found existing collection '{IMAGE_COLLECTION_NAME}'.")
        
        collection = Collection(IMAGE_COLLECTION_NAME)
        collection.load()
        logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' loaded successfully.")
        return collection
    except Exception as e:
        logger.error(f"Milvus initialization failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Cannot connect to or initialize Milvus service: {e}")

logger.info("Loading CLIP model...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
logger.info("CLIP model loaded successfully.")
# ========== 初始化結束 ==========

def process_and_embed_image(image_bytes: bytes) -> list:
    """Helper function to process bytes and create a vector."""
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = clip_processor(images=pil_image, return_tensors="pt")
    with torch.no_grad():
        vector = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()
    return vector

@router.post("/image-insert")
async def image_insert_from_upload(
    image: UploadFile = File(..., description="The image file to be indexed"),
    id: str = Form(..., description="The unique ID for the image")
):
    try:
        logger.info(f"Received indexing request: id='{id}', filename='{image.filename}'")
        contents = await image.read()
        vector = process_and_embed_image(contents)

        coll = get_collection()
        res = coll.insert([[id], [vector]])
        coll.flush()
        
        logger.info(f"Successfully inserted vector for ID '{id}' into Milvus.")
        return {"status": "ok", "insert_count": len(res.primary_keys), "id": id}
    except Exception as e:
        logger.error(f"Error processing indexing request for ID '{id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Insert error: {e}")

@router.post("/image-search")
async def image_search_from_upload(
    image: UploadFile = File(..., description="The image file for searching"),
    top_k: int = Form(5, description="Number of similar results to return")
):
    try:
        logger.info(f"Received search request: top_k={top_k}, filename='{image.filename}'")
        contents = await image.read()
        query_vector = process_and_embed_image(contents)

        coll = get_collection()
        search_params = {"metric_type": "IP", "params": {"nprobe": 64}}
        results = coll.search(
            data=[query_vector], 
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            output_fields=["id"]
        )
        
        hits = [{"id": hit.entity.get("id"), "score": float(hit.distance)} for hit in results[0]]
        logger.info(f"Milvus search completed, found {len(hits)} results.")
        return {"results": hits}
    except Exception as e:
        logger.error(f"Error processing search request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search error: {e}")


app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "Vector Search Service is running"}
