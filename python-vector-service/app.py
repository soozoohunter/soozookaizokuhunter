from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# 可依需求更換模型 (e.g. 'all-MiniLM-L6-v2' / 'multi-qa-MiniLM-L6-cos-v1' ...)
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    text: str

@app.post("/api/v1/text-embed")
def embed_text(req: EmbedRequest):
    # 一次只處理單筆文字 => model.encode([]) 回傳 shape=(1, dim)
    embeddings = model.encode([req.text])
    return {
        "embedding": embeddings[0].tolist()
    }
