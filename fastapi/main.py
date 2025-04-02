import os
from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
import requests
import torch
from transformers import AutoModel, AutoTokenizer
import numpy as np

load_dotenv()

app = FastAPI()

@app.get("/chain/info")
def chain_info():
    rpc_url = os.getenv("BLOCKCHAIN_RPC_URL", "http://geth:8545")
    try:
        data = {
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }
        r = requests.post(rpc_url, json=data)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
def health():
    return {"status": "ok", "service": "FastAPI - Hunter X", "AI_model": "transformers"}

MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L6-v2"
# 模型緩存到 /app/models 目錄（請確保該目錄存在且有寫入權限）
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir="/app/models")
model = AutoModel.from_pretrained(MODEL_NAME, cache_dir="/app/models")
model.eval()

def encode_text(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings.numpy()[0]

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.post("/ai/compare-texts")
async def compare_texts(text1: str, text2: str):
    emb1 = encode_text(text1)
    emb2 = encode_text(text2)
    score = cosine_similarity(emb1, emb2)
    return {"similarity": float(score)}

@app.post("/ai/upload-and-analyze")
async def upload_and_analyze(file: UploadFile = File(...)):
    content = await file.read()
    text_str = content.decode("utf-8", errors="ignore")
    emb = encode_text(text_str)
    return {"message": "檔案已接收", "vectorLength": len(emb)}
