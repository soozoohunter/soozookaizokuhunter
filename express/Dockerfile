# express/Dockerfile (優化與修正版 by Gemini)
# 版本: 2.0
# 日期: 2025-06-25
# 描述:
# 1. 保持所有系統依賴項的安裝。
# 2. 移除在容器內預先建立主機 volume 掛載點的指令 (mkdir)，這應由 docker-compose volumes 管理。
# 3. 確保 COPY 指令的簡潔性。

# 使用官方的 Node.js 18 slim 版本作為基礎映像
FROM node:18-slim

# 設定環境變數，避免 apt-get 在安裝時出現互動式提問
ENV DEBIAN_FRONTEND=noninteractive

# 安裝所有必要的系統依賴項
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
    # --- For Python Scripts ---
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

# 設定 Puppeteer 環境變數，使用系統安裝的 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 先複製依賴描述檔，以便利用 Docker 的快取機制
# 此處的 COPY 是相對於 build context (./express) 的
COPY package*.json ./

# 安裝 Node.js 專案依賴
RUN npm install

# 複製應用程式的其餘所有程式碼到工作目錄
COPY . .

# 開放應用程式運行的端口
EXPOSE 3000

# 設定容器啟動時執行的指令
CMD [ "node", "server.js" ]
