# fastapi/main.py (無 Milvus 最終版)
import os
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.on_event("startup")
def startup_event():
    """
    應用程式啟動事件。
    由於 Milvus 已被棄用，這裡不再執行任何連線操作。
    """
    print("[FastAPI] Application startup complete. Vector search features are disabled.")

@app.on_event("shutdown")
def shutdown_event():
    """
    應用程式關閉事件。
    """
    print("[FastAPI] Application shutting down.")

# [REMOVED] 移除了 /api/v1/image-insert 和 /api/v1/image-search 路由
# 因為它們的功能依賴於已被棄用的 Milvus。

@app.get("/health")
def health():
    """
    一個基礎的健康檢查端點。
    """
    return {"status": "fastapi OK"}

@app.get("/healthz", status_code=200)
async def health_check():
    """
    專為 Docker healthcheck 設計的輕量級健康檢查端點。
    """
    return {"status": "ok"}

# [REMOVED] 所有與資料庫連線、Cloudinary、IPFS、Web3、PDF生成、
# Milvus 連線、CLIP 模型載入、圖片向量化相關的函式和全域變數都已被移除，
# 因為在此服務的職責中已不再需要它們。
# FastAPI 服務現在是一個極簡的存根(stub)服務。
