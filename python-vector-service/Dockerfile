# python-vector-service/Dockerfile
FROM python:3.9-slim
WORKDIR /app

# 安裝 ffmpeg 若需抽幀
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

# 如果只要執行一次爬蟲 => CMD ["python", "crawl_and_index.py"]
# 或您要執行 FastAPI => CMD ["uvicorn", "main:app", "--host=0.0.0.0", "--port=8000"]
CMD ["python", "crawl_and_index.py"]
