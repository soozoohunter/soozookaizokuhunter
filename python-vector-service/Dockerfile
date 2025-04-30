# python-vector-service/Dockerfile

FROM python:3.9-slim

WORKDIR /app

# 安裝一些基本工具 (若需要 git, wget, curl 等)
RUN apt-get update && apt-get install -y \
    git curl wget \
    && rm -rf /var/lib/apt/lists/*

# 複製 requirements.txt 並安裝
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 複製程式碼 (app.py 等)
COPY app.py /app/app.py

EXPOSE 8000

# 使用 uvicorn 啟動 FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
