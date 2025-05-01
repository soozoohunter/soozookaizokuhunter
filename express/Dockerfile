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

# 把所有程式碼(包含 scripts/)先複製到容器；或至少先複製 package*.json 和 scripts/
COPY package*.json ./
COPY scripts ./scripts
COPY . .   # 如果你的 .dockerignore 沒有忽略 scripts，可直接一行 COPY . .

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 接著才 npm install，保證 scripts/checkMilvus.js 已經在容器內
RUN npm install

EXPOSE 3000

CMD ["/bin/bash", "-c", "npm run check:milvus && npm start"]
