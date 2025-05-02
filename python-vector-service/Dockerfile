# python-vector-service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安裝系統相依（如果有需要）
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libgl1 \
 && rm -rf /var/lib/apt/lists/*

# 複製並安裝 Python 套件
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

# 複製應用程式碼
COPY . .

# 啟動 Uvicorn，綁所有介面
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
