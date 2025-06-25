# 使用官方的 Node.js 18 slim 版本作為基礎映像
FROM node:18-slim

# 設定環境變數，避免 apt-get 在安裝時出現互動式提問
ENV DEBIAN_FRONTEND=noninteractive

# 將所有系統依賴項安裝合併到一個 RUN 指令中，以優化 Docker 映像分層和建置快取
# [最佳實踐] 使用 apt 安裝 python3-opencv，以避免 pip 的 PEP 668 環境錯誤。
RUN apt-get update && apt-get install -y --no-install-recommends \
    # --- For Puppeteer & Headless Chrome ---
    chromium \
    fonts-liberation \
    fonts-noto-cjk \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libglib2.0-0 \
    libxrandr2 \
    libatk1.0-0 \
    libdrm2 \
    libgbm1 \
    libpangocairo-1.0-0 \
    libasound2 \
    # --- For Video Processing ---
    ffmpeg \
    # --- For Python Scripts (e.g., Vector Search Pre-processing) ---
    python3 \
    python3-opencv \
    # --- Common Utilities ---
    iputils-ping \
    dnsutils \
    curl \
    vim \
    # --- 清理 apt 快取以減小映像檔體積 ---
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 先複製依賴描述檔，以便利用 Docker 的快取機制
COPY package*.json ./

# 設定 Puppeteer 環境變數：略過下載 Chromium，改用系統安裝的版本
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 安裝 Node.js 專案依賴
RUN npm install

# 複製應用程式的其餘所有程式碼到工作目錄
COPY . ./

# 預先建立應用程式可能需要的資料夾
# 根據日誌分析，新增 /uploads/* 系列資料夾以確保路徑存在
RUN mkdir -p /app/debugShots /uploads/certificates /uploads/reports /uploads/publicImages

# 開放應用程式運行的端口
EXPOSE 3000

# 設定容器啟動時執行的指令
CMD ["npm", "start"]

