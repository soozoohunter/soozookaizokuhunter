import os
import requests
from fastapi import FastAPI
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "FastAPI is healthy"}

# 連到私有鏈
RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

@app.post("/recordInfringement")
def record_infringement(fingerprint: str, infringing_url: str):
    """
    假設已經有合約地址 & abi
    這裡只示範將"侵權資訊"寫進DB或上鏈
    """
    # 寫DB or call contract ...
    # 省略
    return {"message": "Infringement recorded", "fingerprint": fingerprint, "url": infringing_url}
