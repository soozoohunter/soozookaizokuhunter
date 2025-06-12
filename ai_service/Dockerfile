FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

WORKDIR /app

COPY requirements.txt .
RUN sed -i 's#deb.debian.org#mirrors.aliyun.com#g' /etc/apt/sources.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends libgl1-mesa-glx \
 && rm -rf /var/lib/apt/lists/*
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --no-cache-dir -r /tmp/reqs.txt gunicorn

COPY . /app

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]

