FROM python:3.9-slim
WORKDIR /app

# 安裝系統相依套件
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 安裝依賴
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 複製所有程式
COPY . ./

# 預設以 FastAPI 啟動，如要改用爬蟲請傳入 CMD 覆蓋
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
