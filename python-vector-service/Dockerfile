# python-vector-service/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
# 使用阿里云镜像，加速 apt
RUN sed -i 's#deb.debian.org#mirrors.aliyun.com#g' /etc/apt/sources.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libgl1 \
 && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 把实际代码放到最后，保证上面层缓存命中
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

