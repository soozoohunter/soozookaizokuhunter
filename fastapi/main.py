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
