import os
import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from pymilvus import utility, connections, Collection, FieldSchema, CollectionSchema, DataType
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
from PIL import Image

# --- 日誌設定 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 環境變數與常數 ---
MILVUS_ALIAS = "default"
MILVUS_HOST = os.environ.get("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")
COLLECTION_NAME = "image_vectors"
VECTOR_DIM = 384  # all-MiniLM-L6-v2 的維度

# --- 初始化模型 ---
logger.info("正在載入 SentenceTransformer 模型 (all-MiniLM-L6-v2)...")
try:
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    logger.info("模型載入成功。")
except Exception as e:
    logger.error(f"模型載入失敗: {e}")
    model = None

# --- FastAPI App ---
app = FastAPI()

# --- Milvus 連線與初始化 ---
def init_milvus():
    try:
        logger.info(f"正在嘗試連接 Milvus: {MILVUS_HOST}:{MILVUS_PORT}...")
        connections.connect(alias=MILVUS_ALIAS, host=MILVUS_HOST, port=MILVUS_PORT)
        logger.info("Milvus 連接成功。")

        # 檢查 Collection 是否存在
        if not utility.has_collection(COLLECTION_NAME, using=MILVUS_ALIAS):
            logger.info(f"Collection '{COLLECTION_NAME}' 不存在，正在建立...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=255),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=VECTOR_DIM)
            ]
            schema = CollectionSchema(fields, description="Image embedding collection")
            collection = Collection(name=COLLECTION_NAME, schema=schema, using=MILVUS_ALIAS)
            
            # 建立索引
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            collection.create_index(field_name="embedding", index_params=index_params)
            logger.info(f"Collection '{COLLECTION_NAME}' 建立並索引成功。")
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' 已存在。")
        
        # 載入 Collection 到記憶體
        Collection(COLLECTION_NAME).load()
        logger.info(f"Collection '{COLLECTION_NAME}' 已載入記憶體。")

    except Exception as e:
        logger.error(f"Milvus 初始化過程中發生嚴重錯誤: {e}")
        # 如果無法連接Milvus，FastAPI 仍會啟動，但後續操作會失敗

@app.on_event("startup")
async def startup_event():
    if model is None:
        logger.error("模型未成功載入，向量相關 API 將無法運作。")
    init_milvus()

# --- API 端點 ---
@app.post("/api/v1/image-insert")
async def image_insert(id: str = Form(...), image: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="模型未初始化，無法處理請求。")
    try:
        image_data = Image.open(image.file)
        embedding = model.encode(image_data, convert_to_tensor=False)
        
        # 將 embedding 轉換為 list
        embedding_list = embedding.tolist()
        
        collection = Collection(COLLECTION_NAME)
        collection.insert([[id], [embedding_list]])
        
        logger.info(f"成功插入 ID: {id} 的向量。")
        return {"status": "ok", "insert_count": 1, "id": id}
    except Exception as e:
        logger.error(f"插入向量時發生錯誤 (ID: {id}): {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/image-search")
async def image_search(top_k: int = Form(5), image: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="模型未初始化，無法處理請求。")
    try:
        image_data = Image.open(image.file)
        query_vector = model.encode(image_data, convert_to_tensor=False).tolist()
        
        collection = Collection(COLLECTION_NAME)
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
        
        results = collection.search(
            data=[query_vector],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            output_fields=["id"]
        )
        
        # 格式化回傳結果以匹配 Node.js 的期望
        formatted_results = [
            {"id": hit.entity.get('id'), "score": hit.distance} for hit in results[0]
        ]
        logger.info(f"搜尋到 {len(formatted_results)} 個相似結果。")
        return {"results": formatted_results}
    except Exception as e:
        logger.error(f"搜尋向量時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
