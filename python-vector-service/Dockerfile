# python-vector-service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安裝必要的 system lib (Pillow / OpenCV 用到的)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libgl1 \
 && rm -rf /var/lib/apt/lists/*

# 1) 複製 requirements 並安裝所有 Python 套件（包含 celery）
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 2) 複製程式碼
COPY . .

# 3) 開放 uvicorn 所用的 8000 端口
EXPOSE 8000

# 4) 啟動 FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
