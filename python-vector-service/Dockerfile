# python-vector-service/Dockerfile

FROM python:3.9-slim

WORKDIR /app

# 安裝一些必要套件 (git、curl...etc)
RUN apt-get update && apt-get install -y \
    git curl wget && \
    rm -rf /var/lib/apt/lists/*

# requirements.txt
COPY requirements.txt /app/requirements.txt

# 安裝 python 套件
RUN pip install --no-cache-dir -r requirements.txt

# 拷貝程式
COPY app.py /app/app.py

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
