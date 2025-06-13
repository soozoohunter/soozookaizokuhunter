FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

# 替换国内源，Debian slim 把源放在 sources.list.d 里
RUN ( [ -f /etc/apt/sources.list ] && sed -i 's#deb.debian.org#mirrors.aliyun.com#g' /etc/apt/sources.list || true ) \
    && find /etc/apt/sources.list.d -name '*.list' -exec sed -i 's#deb.debian.org#mirrors.aliyun.com#g' {} + \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/reqs.txt

COPY . /app/

CMD ["python", "daemon_crawl.py"]

