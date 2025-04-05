from fastapi import FastAPI
import os
from web3 import Web3

app = FastAPI()

@app.on_event("startup")
def startup_event():
    eth_rpc_url = os.getenv("ETH_RPC_URL", "http://suzoo_geth:8545")
    w3 = Web3(Web3.HTTPProvider(eth_rpc_url))
    if w3.isConnected():
        print("[FastAPI] Connected to Ethereum node:", eth_rpc_url)
    else:
        print("[FastAPI] Failed to connect Ethereum node")

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI - SooZooHunter"}
