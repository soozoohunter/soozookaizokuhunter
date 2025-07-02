# fastapi/api.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import cv2

app = FastAPI()

@app.post("/api/v1/search-image")
async def search_image(file: UploadFile = File(...), top_k: int = Form(3)):
    # 1. 讀取檔案 => 做向量化 => 向 Milvus 查詢 => 回傳相似度列表
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # TODO: 這裡做 embedding or feature extraction
    # 例如: feature = some_model(img)
    # mock vector:
    feature = np.random.rand(1, 512).tolist()[0]  # just a mock

    # Milvus 查詢 (示範)
    # milvus = Milvus(host='suzoo_milvus', port='19530')
    # results = milvus.search(collection_name='images', data=[feature], top_k=top_k)
    # mock result
    results = [
        {"id": 101, "score": 0.9, "url": "https://some-site.com/img101"},
        {"id": 102, "score": 0.83, "url": "https://some-site.com/img102"}
    ]

    return JSONResponse({"results": results})

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=False)
