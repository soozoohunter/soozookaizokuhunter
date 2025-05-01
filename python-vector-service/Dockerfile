FROM python:3.9-slim

WORKDIR /app

# 安裝一些基本工具 (git、wget、curl等)，若不需要可自行刪除
RUN apt-get update && apt-get install -y \
    git curl wget \
    && rm -rf /var/lib/apt/lists/*

# 複製 requirements.txt 並安裝 Python 套件
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 拷貝程式碼 (app.py)
COPY app.py /app/app.py

EXPOSE 8000

# 啟動 FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
