# python-vector-service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# （可選）安裝系統套件
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libgl1 \
 && rm -rf /var/lib/apt/lists/*

# 複製 requirements 並安裝
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 複製程式
COPY . .

# 讓 container 內 uvicorn 聽 8000
EXPOSE 8000

# 啟動 FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
