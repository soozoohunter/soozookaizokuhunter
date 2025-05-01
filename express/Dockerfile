FROM node:18

# 安裝系統必要套件 (chromium + ffmpeg + 中文字體 + puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先複製 package.json + package-lock.json
COPY package*.json ./

# [新增] 這一步先把 scripts/ checkMilvus.js 也複製進去
COPY scripts ./scripts

# 再安裝，避免 postinstall 找不到 scripts/checkMilvus.js
RUN npm install

# 最後再把其他檔案 (server.js, routes 等) 全部複製
COPY . .

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["/bin/bash", "-c", "npm run check:milvus && npm start"]
