# python-vector-service/app.py (Milvus Lite 連線修正版)

import logging
# --- Milvus Lite 初始化開始 ---
try:
    from milvus_lite.server import server
    # 設定一個在容器內的路徑來永久保存 Milvus 數據
    server.set_config("storage.path", "/app/milvus_data")
    server.start()
    logging.info("[Milvus Lite] 伺服器已成功啟動。")
except Exception as e:
    logging.error(f"[Milvus Lite] 伺服器啟動失敗: {e}", exc_info=True)
# --- 初始化結束 ---


import os
import io
from typing import Optional
import base64 

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

# Collection 配置
IMAGE_COLLECTION_NAME = "image_collection_v2" 
DIM_IMAGE = 512

# FastAPI 應用
app = FastAPI(title="Suzoo Vector Service with Milvus Lite")
router = APIRouter(prefix="/api/v1")


# ========== 服務與模型初始化 ==========
collection_instance = None
def get_collection():
    """
    連接到本地 Milvus Lite 服務並確保 Collection 已準備就緒。
    """
    global collection_instance
    if collection_instance is not None:
        return collection_instance

    try:
        # ★★★ 核心修正：明確告訴 pymilvus 客戶端要連接的本地資料庫檔案路徑 ★★★
        # 這個路徑與頂部 server.set_config 的路徑相呼應。
        logger.info("Connecting to local Milvus Lite DB at /app/milvus_data/milvus.db...")
        connections.connect("default", uri="/app/milvus_data/milvus.db")
        logger.info("Successfully connected to Milvus Lite.")

        # 檢查 Collection 是否存在，若不存在則建立
        if not utility.has_collection(IMAGE_COLLECTION_NAME):
            logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' not found. Creating...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=255, is_primary=True),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
            ]
            schema = CollectionSchema(fields, description="Stores CLIP embeddings of images.")
            coll = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
            
            # 建立索引
            index_params = {"index_type":"IVF_FLAT", "metric_type":"IP", "params":{"nlist":1024}}
            coll.create_index(field_name="embedding", index_params=index_params)
            logger.info("Index created successfully.")
        else:
            logger.info(f"Found existing collection '{IMAGE_COLLECTION_NAME}'.")

        # 載入 Collection 到記憶體
        collection_instance = Collection(IMAGE_COLLECTION_NAME)
        collection_instance.load()
        logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' loaded successfully.")
        return collection_instance

    except Exception as e:
        logger.error(f"Milvus Lite initialization failed: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Cannot initialize Milvus Lite service: {e}")


# CLIP 模型載入
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
    image: Optional[UploadFile] = File(None, description="The image file for searching"),
    image_base64: Optional[str] = Form(None, description="Base64 encoded image string"),
    top_k: int = Form(5, description="Number of similar results to return")
):
    contents = None
    if image:
        logger.info(f"Received search request via file upload: top_k={top_k}, filename='{image.filename}'")
        contents = await image.read()
    elif image_base64:
        logger.info(f"Received search request via base64: top_k={top_k}")
        contents = base64.b64decode(image_base64)
    else:
        raise HTTPException(status_code=400, detail="No image provided. Use 'image' or 'image_base64'.")

    try:
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
    return {"status": "Vector Search Service with Milvus Lite is running"}
