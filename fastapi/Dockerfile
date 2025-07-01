FROM python:3.9-slim

WORKDIR /app

# 升級 pip，並安裝相關套件（含 uvicorn）
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && python - <<'EOF'
from transformers import CLIPProcessor, CLIPModel
CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
EOF \
    && pip show uvicorn  # 明確檢查uvicorn安裝成功

# 複製 FastAPI 專案程式碼
COPY . .

EXPOSE 8000

# 以 uvicorn 執行 FastAPI 應用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
