from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# 可依需求更換您所需的模型: 
#   'all-MiniLM-L6-v2' / 'multi-qa-MiniLM-L6-cos-v1' 等
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    text: str

@app.post("/api/v1/text-embed")
def embed_text(req: EmbedRequest):
    # 一次只處理一筆文字 => model.encode([]) 回傳 ndarray，shape=(1, dim)
    embeddings = model.encode([req.text])
    return {
        "embedding": embeddings[0].tolist()
    }
