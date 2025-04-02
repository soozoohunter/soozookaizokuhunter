import os
from fastapi import FastAPI
from dotenv import load_dotenv
import requests

load_dotenv()

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI Kaikaishield X"}

# 可在此撰寫區塊鏈 or 爬蟲 or AI 分析端點
@app.get("/chain/info")
def chain_info():
    # 範例：呼叫 Geth RPC 取當前區塊數
    rpc_url = os.getenv("BLOCKCHAIN_RPC_URL", "http://geth:8545")
    try:
        data = {
            "jsonrpc":"2.0",
            "method":"eth_blockNumber",
            "params":[],
            "id":1
        }
        r = requests.post(rpc_url, json=data)
        return r.json()
    except Exception as e:
        return {"error": str(e)}
