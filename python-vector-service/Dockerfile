# python-vector-service/Dockerfile
FROM python:3.9-slim

# 替换国内源，Debian slim 把源放在 sources.list.d 里
RUN [ -f /etc/apt/sources.list ] && sed -i 's#deb.debian.org#mirrors.aliyun.com#g' /etc/apt/sources.list || true \
    && find /etc/apt/sources.list.d -name '*.list' -exec sed -i 's#deb.debian.org#mirrors.aliyun.com#g' {} + \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential libgl1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 把实际代码放到最后，保证上面层缓存命中
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

