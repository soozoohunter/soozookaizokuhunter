# fastapi/Dockerfile
FROM python:3.10-slim

# 安裝必要套件，包含 gcc, libpq-dev 等，以便安裝 psycopg2、ipfshttpclient、web3 等
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    build-essential \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先複製 requirements.txt 並安裝
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# 再複製整個 FastAPI 專案程式碼
COPY . .

EXPOSE 8000

# 預設使用 uvicorn 啟動 FastAPI，監聽 0.0.0.0:8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
