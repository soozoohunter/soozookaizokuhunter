# python/main.py (一個健壯的、可運行的範本)

import io
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, APIRouter
from fastapi.responses import JSONResponse
from PIL import Image
import logging

# ========== 日誌設定 ==========
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== 服務初始化 (請在此處載入您的 AI 模型和連接 Milvus) ==========
# 範例:
# try:
#     logger.info("正在載入 AI 模型...")
#     model = YourEmbeddingModel()
#     logger.info("AI 模型載入成功。")
#
#     logger.info("正在連接 Milvus...")
#     milvus_client = YourMilvusClient()
#     logger.info("Milvus 連接成功。")
# except Exception as e:
#     logger.error(f"服務初始化失敗: {e}")
#     model = None
#     milvus_client = None

# ========== FastAPI 應用與路由設定 ==========
app = FastAPI(title="Vector Search Service")
router = APIRouter(prefix="/api/v1")


@router.post("/image-insert")
async def image_insert(
    image: UploadFile = File(..., description="要索引的圖片檔案"),
    id: str = Form(..., description="圖片的唯一 ID (來自資料庫)")
):
    """
    接收圖片和 ID，產生向量並存入 Milvus。
    """
    # if not model or not milvus_client:
    #     raise HTTPException(status_code=503, detail="服務尚未完全初始化，請稍後再試。")
        
    try:
        logger.info(f"收到索引請求: id='{id}', filename='{image.filename}'")

        # 讀取圖片內容
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        
        logger.info(f"圖片讀取成功: format={pil_image.format}, size={pil_image.size}")

        # 1. 在這裡使用您的 AI 模型產生圖片向量
        # image_vector = model.encode(pil_image)
        # logger.info(f"成功為 ID '{id}' 產生向量。")
        
        # 2. 在這裡將 ID 和向量存入 Milvus
        # milvus_client.insert(id, image_vector)
        # logger.info(f"成功將 ID '{id}' 的向量存入 Milvus。")
        
        # 模擬成功
        mock_vector = [0.1] * 128

        return JSONResponse(
            status_code=200,
            content={
                "message": "Image indexed successfully",
                "id": id,
                "filename": image.filename,
                "vector_shape": len(mock_vector)
            }
        )

    except Exception as e:
        logger.error(f"處理 ID '{id}' 的索引請求時發生錯誤: {e}", exc_info=True)
        # 返回一個標準的 JSON 錯誤，而不是讓 FastAPI 崩潰
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while processing image: {str(e)}"
        )


@router.post("/image-search")
async def image_search(
    image: UploadFile = File(..., description="用於搜尋的圖片檔案"),
    top_k: int = Form(3, description="要回傳的最相似結果數量")
):
    """
    接收圖片，產生向量並在 Milvus 中搜尋最相似的 K 個結果。
    """
    # if not model or not milvus_client:
    #     raise HTTPException(status_code=503, detail="服務尚未完全初始化，請稍後再試。")

    try:
        logger.info(f"收到搜尋請求: top_k={top_k}, filename='{image.filename}'")

        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        
        logger.info(f"搜尋圖片讀取成功: format={pil_image.format}, size={pil_image.size}")
        
        # 1. 產生查詢圖片的向量
        # query_vector = model.encode(pil_image)
        # logger.info("成功為查詢圖片產生向量。")

        # 2. 在 Milvus 中進行搜尋
        # search_results = milvus_client.search(query_vector, top_k)
        # logger.info(f"Milvus 搜尋完成，找到 {len(search_results)} 個結果。")
        
        # 模擬成功的回傳結果
        mock_results = {
            "results": [
                {"id": "1", "score": 0.99, "url": "https://example.com/img1.jpg"},
                {"id": "2", "score": 0.98, "url": "https://example.com/img2.jpg"},
            ]
        }

        return JSONResponse(status_code=200, content=mock_results)

    except Exception as e:
        logger.error(f"處理搜尋請求時發生錯誤: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while searching for image: {str(e)}"
        )

# 將路由掛載到主應用上
app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "Vector Search Service is running"}
