from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# 請依需求自行選擇適合的模型 (如 'all-MiniLM-L6-v2' / 'multi-qa-MiniLM-L6-cos-v1' / etc.)
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    text: str

@app.post("/api/v1/text-embed")
def embed_text(req: EmbedRequest):
    embeddings = model.encode([req.text])  # shape: (1, dim)
    return {
        "embedding": embeddings[0].tolist()
    }
