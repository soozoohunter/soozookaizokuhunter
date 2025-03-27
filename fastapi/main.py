import uvicorn
from fastapi import FastAPI, UploadFile, File
from typing import Optional, List
from blockchain import upload_to_eth
from crawler import crawl_social
from analytics import calculate_cpi, suggest_cma
from dmca import bulk_infringement_check, initiate_lawsuit

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI V4"}

@app.post("/blockchain/upload")
async def blockchain_upload(file: UploadFile = File(...), owner_id: int = 0):
    content = await file.read()
    tx_hash = upload_to_eth(content, owner_id)
    return {"tx_hash": tx_hash}

@app.get("/crawl/{platform}")
def crawl(platform: str, keyword: Optional[str] = None):
    if not keyword:
        return {"error": "keyword is required"}
    data = crawl_social(platform, keyword)
    return data

@app.post("/analysis/cpi")
def analysis_cpi(video_url: str):
    return {"video_url": video_url, "CPI": calculate_cpi(video_url)}

@app.post("/analysis/cma")
def analysis_cma(video_url: str):
    return suggest_cma(video_url)

@app.post("/enterprise/bulkCheck")
def enterprise_bulk_check(fingerprints: List[str]):
    return {"results": bulk_infringement_check(fingerprints)}

@app.post("/lawsuit/initiate")
def lawsuit_init(work_id: int):
    return {"lawsuit_status": initiate_lawsuit(work_id)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
