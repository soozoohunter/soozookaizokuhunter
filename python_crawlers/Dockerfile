FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 複製需求檔
COPY requirements.txt .
# Skip installing torch/torchvision (already included in base image)
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/reqs.txt

# 複製所有程式碼
COPY . /app/

# 啟動 daemon_crawl.py（長期爬蟲 daemon）
CMD ["python", "daemon_crawl.py"]
