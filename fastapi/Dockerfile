# fastapi/Dockerfile (最終版，已安裝 curl)

# Stage 1: Base Image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies.
# [FIX] 新增 'curl' 套件，以供健康檢查使用。
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
