FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 複製需求檔
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# 複製所有程式碼
COPY . /app/

# 啟動 daemon_crawl.py（長期爬蟲 daemon）
CMD ["python", "daemon_crawl.py"]
