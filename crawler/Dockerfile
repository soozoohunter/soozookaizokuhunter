FROM python:3.9-slim
WORKDIR /crawler
COPY crawler-requirements.txt .
RUN pip install --no-cache-dir -r crawler-requirements.txt
COPY crawler.py .
CMD ["python","crawler.py"]
