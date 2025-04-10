# 文件路徑: fastapi/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import hashlib
import os

app = FastAPI()

# 從系統環境變數讀取合約地址
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0xYourContractAddressHere")

@app.get("/health")
def health():
    """
    健康檢查端點
    同時回傳 FastAPI 服務狀態 & 當前讀取的合約地址(測試用途)
    """
    return {
        "status": "ok",
        "service": "fastapi",
        "contract_address": CONTRACT_ADDRESS
    }

class FileURL(BaseModel):
    url: str

@app.post("/fingerprint")
def fingerprint(data: FileURL):
    """
    下載指定 URL 的檔案內容, 計算其 MD5 指紋, 回傳 JSON
    """
    try:
        r = requests.get(data.url, timeout=10)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"無法下載檔案: {e}")

    md5_hash = hashlib.md5(r.content).hexdigest()
    return {"fingerprint": md5_hash}
