FROM python:3.10-slim

# 安裝必要套件（gcc, libpq-dev, libssl-dev, libffi-dev 等）
# 可滿足 psycopg2、ipfshttpclient、web3 等依賴
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    build-essential \
    libpq-dev \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 先複製 requirements.txt 並安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# 複製完整 FastAPI 專案程式碼
COPY . .

# 容器對外預設監聽埠
EXPOSE 8000

# 預設指令：使用 Uvicorn 啟動 FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
