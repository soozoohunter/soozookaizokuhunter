from fastapi import FastAPI
import os
from web3 import Web3

app = FastAPI()

# 連接到 Ganache (ETH_RPC_URL= http://suzoo_ganache:8545)
GANACHE_URL = os.environ.get("ETH_RPC_URL", "http://localhost:8545")
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

@app.get("/health")
def health():
    # 測試連線：抓一下 Ganache 的最新區塊號
    block_number = w3.eth.block_number
    return {"status":"ok","service":"FastAPI","ganache_block": block_number}
