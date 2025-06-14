FROM node:18-slim

# 安裝必要套件 (Chromium / ffmpeg / 字體 / Puppeteer 等)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping dnsutils curl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先複製依賴描述
COPY package*.json ./

# Puppeteer 設定：略過內建下載、使用 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 安裝 Node.js 依賴
RUN npm install

# 複製其餘檔案 (server.js, routes, models...)
COPY . ./

# 預先建立可能需要的資料夾 => /app/debugShots
RUN mkdir -p /app/debugShots

# 預設埠
EXPOSE 3000

CMD ["npm", "start"]
