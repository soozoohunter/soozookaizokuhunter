FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

WORKDIR /app

COPY requirements.txt .
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*
RUN grep -v '^torch' requirements.txt | grep -v '^torchvision' > /tmp/reqs.txt \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/reqs.txt

COPY . /app/

CMD ["python", "daemon_crawl.py"]

