# 使用官方 PyTorch 映像檔作為基礎，已包含 CUDA 和 cuDNN
FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

# 設定工作目錄
WORKDIR /app

# 複製需求文件
COPY requirements.txt .

# ★★★★★【請修改此處】★★★★★
# 在安裝 Python 套件前，先安裝 OpenCV 需要的系統依賴。
# 原本只安裝了 libgl1-mesa-glx，我們需要額外加上 libglib2.0-0 來解決 libgthread 的問題。
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
# ★★★★★★★★★★★★★★★★★★

# 過濾掉基礎映像檔已包含的 torch 和 torchvision，然後安裝其餘的 Python 依賴和 Gunicorn
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --no-cache-dir -r /tmp/reqs.txt gunicorn

# 複製整個應用程式的程式碼到工作目錄
COPY . /app

# 開放服務的端口
EXPOSE 5000

# 容器啟動時執行的指令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]
