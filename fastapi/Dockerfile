# 使用 python:3.10-slim 作為基底
FROM python:3.10-slim

# 1) 安裝系統層依賴 (包含libpq-dev, gcc等)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*

# 2) 設定工作目錄
WORKDIR /app

# 3) 複製 requirements.txt 進容器
COPY requirements.txt ./

# 4) 安裝 Python 套件
RUN pip install --no-cache-dir -r requirements.txt

# 5) 複製所有原始碼
COPY . /app

# 6) 對外開放 FastAPI 端口 (例如 8000)
EXPOSE 8000

# 7) 容器啟動時執行 uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
