FROM pytorch/pytorch:1.13.1-cpu

# 安裝必要套件 (含 opencv)
RUN apt-get update && apt-get install -y libgl1-mesa-glx && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製需求檔
COPY requirements.txt .
# Skip installing torch/torchvision (already included in base image)
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --no-cache-dir -r /tmp/reqs.txt gunicorn

# 複製程式碼
COPY . /app

EXPOSE 5000

# 改用 Gunicorn 啟動 Flask (適合生產環境)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]
