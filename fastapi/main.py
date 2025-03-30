from fastapi import FastAPI
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
    # 這裡確保 "DEPLOY_CONTRACT_ON_START" == "true" 時，於啟動階段自動執行 deploy_contract()
    if os.getenv("DEPLOY_CONTRACT_ON_START","false") == "true":
        print("DEPLOY_CONTRACT_ON_START=true，準備部署合約…")
        try:
            addr = blockchain.deploy_contract()  # 內部已印出 'Compiling contract...' & 'Contract deployed at:...'
            blockchain.contract_address = addr
            print(f"合約已部署成功，地址 = {addr}")
        except Exception as e:
            print("部署合約時發生錯誤:", e)

@app.get("/health")
def health():
    return {"status": "FastAPI V7 is healthy"}

@app.post("/analyze")
def analyze(video_url: str):
    # 簡易模擬短影音分析 (CPI, CMA)
    return analytics.video_analysis(video_url)

@app.post("/blockchain/upload")
def bc_upload(data: str):
    """
    這裡示範: 以 data: str 當作欲上傳區塊鏈的 'bytes'，
    若您要真的上傳檔案, 改為:
        from fastapi import File, UploadFile
        async def bc_upload(file: UploadFile = File(...)):
            ...
    同時需確保 'python-multipart' 安裝
    """
    # 模擬將 data(可視為 bytes)上鏈
    tx_hash = blockchain.upload_to_chain(data.encode())
    return {"tx_hash": tx_hash}

@app.get("/crawl/{platform}")
def do_crawl(platform: str, keyword: str):
    # 模擬爬蟲
    return crawler.crawl_social(platform, keyword)

@app.post("/dmca/lawsuit")
def do_lawsuit(work_id: int, infringing_url: str):
    # 模擬 DMCA 訴訟提交
    return dmca.initiate_lawsuit(work_id, infringing_url)
