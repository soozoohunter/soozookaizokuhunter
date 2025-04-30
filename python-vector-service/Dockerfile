# python-vector-service/Dockerfile

FROM python:3.9-slim

# (可選) 安裝 ffmpeg (若您要在 Python 裏頭抽幀)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 建立工作目錄 /app
WORKDIR /app

# 複製 requirements.txt 並安裝
COPY requirements.txt /app/requirements.txt

# ★ 先升級 pip，再依照 requirements.txt 安裝套件
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 複製當前目錄(包含 app.py)到 /app
COPY . /app

# 指定容器埠
EXPOSE 8000

CMD ["python", "app.py"]
