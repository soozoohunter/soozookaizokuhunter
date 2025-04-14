# fastapi/main.py
from fastapi import FastAPI, UploadFile, File
import hashlib

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi"}

@app.post("/fingerprint")
async def fingerprint(file: UploadFile = File(...)):
    """
    接收檔案上傳 (binary), 回傳其指紋 (SHA-256)。
    如需重複偵測，需後端自行比對資料庫或檢索。
    """
    content = await file.read()
    sha = hashlib.sha256(content).hexdigest()

    # 這裡可去查資料庫看是否重複
    duplicate = False
    matchId = None

    return {
        "fingerprint": sha,
        "duplicate": duplicate,
        "matchId": matchId
    }
