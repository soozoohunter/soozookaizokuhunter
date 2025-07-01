# 使用官方的 Python 3.9 slim 版本作為基礎映像，體積小且穩定
FROM python:3.9-slim

# 在容器中建立並設定工作目錄
WORKDIR /app

# --- 安裝依賴 ---
# 為了利用 Docker 的層快取機制，我們先只複製 requirements.txt
COPY requirements.txt .

# 執行 pip install 指令。
# --no-cache-dir 參數可以減少映像檔的體積。
# 將 pip 升級和安裝套件寫在同一個 RUN 指令中，以減少映像層數。
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- AI 模型預熱 (Cache Warming) ---
# 在建置階段就下載模型，這樣服務啟動時就不再需要網路請求，會快很多。
# 注意：這會讓你的 Docker image 體積增加數 GB。
RUN python -c "from transformers import CLIPProcessor, CLIPModel; print('Downloading CLIP model...'); CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); print('Downloading CLIP processor...'); CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32'); print('Model cache warmed up.')"

# 將所有應用程式程式碼複製到工作目錄
COPY . .

# 向外部開放 8000 端口
EXPOSE 8000

# 設定容器啟動時要執行的預設指令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]