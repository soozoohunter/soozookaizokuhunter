from fastapi import FastAPI, UploadFile, File
import os
import analytics
import blockchain
import crawler
import dmca
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

@app.on_event("startup")
def on_start():
    if os.getenv("DEPLOY_CONTRACT_ON_START","false") == "true":
        addr = blockchain.deploy_contract()
        blockchain.contract_address = addr  # 全域保存

@app.get("/health")
def health():
    return {"status": "FastAPI V6.0 is healthy"}

@app.post("/analyze")
def analyze(video_url: str):
    return analytics.video_analysis(video_url)

@app.post("/blockchain/upload")
async def bc_upload(file: UploadFile = File(...)):
    content = await file.read()
    tx_hash = blockchain.upload_to_chain(content)
    return {"tx_hash": tx_hash}

@app.get("/crawl/{platform}")
def do_crawl(platform: str, keyword: str):
    return crawler.crawl_social(platform, keyword)

@app.post("/dmca/lawsuit")
def do_lawsuit(work_id: int, infringing_url: str):
    return dmca.initiate_lawsuit(work_id, infringing_url)
