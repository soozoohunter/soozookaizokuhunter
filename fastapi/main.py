from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import hashlib

app = FastAPI()

class FileURL(BaseModel):
    url: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/fingerprint")
def fingerprint(data: FileURL):
    try:
        r = requests.get(data.url, timeout=10)
        r.raise_for_status()
    except Exception as e:
        print(f"Download error: {e}")
        raise HTTPException(status_code=400, detail="無法下載檔案")
    content = r.content
    md5 = hashlib.md5(content).hexdigest()
    return {"fingerprint": md5}