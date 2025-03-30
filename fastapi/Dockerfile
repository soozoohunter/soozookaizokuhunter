# fastapi/Dockerfile
FROM python:3.10-slim

# 安装系统依赖（确保每行以 \ 结尾且无注释）
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    g++ \
    make \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
