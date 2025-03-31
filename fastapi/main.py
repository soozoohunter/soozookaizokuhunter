from fastapi import FastAPI
import os
import requests
from dotenv import load_dotenv
import blockchain
import crawler
import analytics

load_dotenv()
app = FastAPI()

@app.on_event("startup")
def on_start():
    # 若 .env 中 DEPLOY_CONTRACT_ON_START=true，啟動時自動部署
    if os.getenv("DEPLOY_CONTRACT_ON_START","false") == "true":
        try:
            addr = blockchain.deploy_contract()
            blockchain.contract_address = addr
            print(f"[FastAPI] 已自動部署合約: {addr}")
        except Exception as e:
            print("[FastAPI] 自動部署合約失敗:", e)

@app.get("/health")
def health():
    return {"status":"FastAPI v9 is healthy"}

@app.get("/crawler-test")
def crawler_test(url:str):
    # 測試呼叫 crawler
    r = requests.post("http://crawler:8081/detect", json={"url":url,"fingerprint":"123abc"})
    return {"crawler_response":r.json()}

@app.post("/analyze")
def analyze_video(video_url:str):
    return analytics.video_analysis(video_url)
