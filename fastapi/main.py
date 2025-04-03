import threading
import time

from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModel

app = FastAPI()

MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L6-v2"
model = None
tokenizer = None
models_loaded = False

def load_models():
    global model, tokenizer, models_loaded
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir="/app/models")
    model = AutoModel.from_pretrained(MODEL_NAME, cache_dir="/app/models")
    model.eval()
    models_loaded = True

@app.on_event("startup")
def on_startup():
    # 後台執行載入模型
    thread = threading.Thread(target=load_models)
    thread.start()

@app.get("/health")
def health():
    """回傳健康狀態 + 模型狀態"""
    if not models_loaded:
        return {"status": "loading", "service": "FastAPI - Hunter X"}
    return {"status": "ok", "service": "FastAPI - Hunter X"}

@app.get("/test")
def test_endpoint():
    return {"message": "FastAPI is running and model might be loaded."}
