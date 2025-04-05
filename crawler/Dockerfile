FROM python:3.9-slim

WORKDIR /crawler
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY crawler.py /crawler/
EXPOSE 9090
CMD ["python", "crawler.py"]
