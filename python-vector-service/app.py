# python-vector-service/app.py (最終修正版)
import os
import io
import sqlite3
import sys
import requests
import base64
import logging
from typing import Optional

# 【修正】: 引入 APIRouter, File, UploadFile, Form
from fastapi import FastAPI, HTTPException, APIRouter, File, UploadFile, Form
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

# 日誌設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 环境变量
BROKER_URL = os.environ.get("BROKER_URL", "amqp://admin:123456@suzoo_rabbitmq:5672//")
RESULT_BACKEND = os.environ.get("RESULT_BACKEND", "rpc://")
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")

# Collection 配置
IMAGE_COLLECTION_NAME = "image_collection"
DIM_IMAGE = 512

# FastAPI & Celery
app = FastAPI(title="Suzoo Vector Service")
celery_app = Celery("celery_client", broker=BROKER_URL, backend=RESULT_BACKEND)
router = APIRouter(prefix="/api/v1")


# ========== 服務與模型初始化 ==========
collection = None
def get_collection():
    global collection
    if collection is not None:
        try:
            # 簡單檢查連線是否健康
            utility.has_collection(IMAGE_COLLECTION_NAME, using='default')
            return collection
        except Exception:
            logger.warning("Milvus 連線可能已中斷，嘗試重新連線...")
            collection = None

    try:
        logger.info(f"正在連接 Milvus: {MILVUS_HOST}:{MILVUS_PORT}")
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        
        if not utility.has_collection(IMAGE_COLLECTION_NAME):
            logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' 不存在，正在建立...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=255, is_primary=True), # 【修正】: ID 應為 VARCHAR 以儲存 Node.js 的 fileId
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM_IMAGE),
            ]
            schema = CollectionSchema(fields, description="Store CLIP embeddings of images.")
            coll = Collection(name=IMAGE_COLLECTION_NAME, schema=schema)
            coll.create_index(field_name="embedding", index_params={"index_type":"IVF_FLAT","metric_type":"IP","params":{"nlist":1024}})
            logger.info("索引建立成功。")
        else:
            logger.info(f"找到已存在的 Collection '{IMAGE_COLLECTION_NAME}'。")
        
        collection = Collection(IMAGE_COLLECTION_NAME)
        collection.load()
        logger.info(f"Collection '{IMAGE_COLLECTION_NAME}' 載入成功。")
        return collection
    except Exception as e:
        logger.error(f"Milvus 初始化失敗: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"無法連接或初始化 Milvus 服務: {e}")

logger.info("正在載入 AI 模型...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
logger.info("AI 模型載入成功。")
# ========== 初始化結束 ==========


# 【API 修正】: 將此端點改為接收檔案上傳
@router.post("/image-insert")
async def image_insert_from_upload(
    image: UploadFile = File(..., description="要索引的圖片檔案"),
    id: str = Form(..., description="圖片的唯一 ID (來自 Node.js 資料庫)")
):
    try:
        logger.info(f"收到索引請求: id='{id}', filename='{image.filename}'")
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        inputs = clip_processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            v = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        coll = get_collection()
        # 【修正】: Milvus 的字串主鍵需要明確指定
        res = coll.insert([[id], [v]])
        coll.flush()
        
        logger.info(f"成功將 ID '{id}' 的向量存入 Milvus。")
        return {"status": "ok", "insert_count": len(res.primary_keys), "id": id}
    except Exception as e:
        logger.error(f"處理 ID '{id}' 的索引請求時發生錯誤: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Insert error: {e}")


# 【API 修正】: 將此端點改為接收檔案上傳
@router.post("/image-search")
async def image_search_from_upload(
    image: UploadFile = File(..., description="用於搜尋的圖片檔案"),
    top_k: int = Form(5, description="要回傳的最相似結果數量")
):
    try:
        logger.info(f"收到搜尋請求: top_k={top_k}, filename='{image.filename}'")
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")

        inputs = clip_processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            qv = clip_model.get_image_features(**inputs)[0].cpu().numpy().tolist()

        coll = get_collection()
        results = coll.search(
            data=[qv], anns_field="embedding",
            param={"metric_type":"IP","params":{"nprobe":64}},
            limit=top_k, output_fields=["id"] # 【修正】: 我們的 collection 中沒有 url 欄位, 只有 id
        )
        
        # 【修正】: 從 Milvus 結果中正確提取 'id'
        hits = [{"id": h.entity.get("id"), "score": float(h.distance)} for h in results[0]]
        logger.info(f"Milvus 搜尋完成，找到 {len(hits)} 個結果。")
        return {"results": hits}
    except Exception as e:
        logger.error(f"處理搜尋請求時發生錯誤: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search error: {e}")

# 將路由掛載到主應用上
app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "Vector Search Service is running"}
