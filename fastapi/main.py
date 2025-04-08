from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import hashlib

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi"}

class FileURL(BaseModel):
    url: str

@app.post("/fingerprint")
def fingerprint(data: FileURL):
    try:
        r = requests.get(data.url, timeout=10)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"無法下載檔案: {e}")
    md5 = hashlib.md5(r.content).hexdigest()
    return {"fingerprint": md5}
