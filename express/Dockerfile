# express/Dockerfile (最終依賴完整版)

# 使用 Node.js 20 以獲得最佳效能與相容性
FROM node:20-slim

# [FIX] 安裝 Puppeteer 運行所需的所有系統函式庫
RUN apt-get update \
    && apt-get install -y \
    tini \
    curl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 優先複製 package.json 以利用 Docker 快取機制
COPY package*.json ./

# 安裝所有生產環境依賴
RUN npm install --omit=dev

# 複製所有應用程式程式碼
COPY . .

# 將 tini 設置為容器的進入點，用於正確處理進程信號
ENTRYPOINT ["/usr/bin/tini", "--"]

# 預設執行的指令 (會被 docker-compose.yml 中的 command 覆蓋)
CMD ["node", "server.js"]
