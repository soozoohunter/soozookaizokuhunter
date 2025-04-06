FROM python:3.10-slim

WORKDIR /app

RUN pip install psycopg2-binary requests

COPY crawler.py .

CMD ["python","crawler.py"]
