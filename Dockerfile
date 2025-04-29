# (express/Dockerfile)

FROM node:18

# 1) 安裝系統必要套件 (chromium + ffmpeg + fonts + Puppeteer 依賴) + 常見指令
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg2 ca-certificates apt-transport-https \
    libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxi6 \
    libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libatk-bridge2.0-0 libdrm2 libgbm1 libpangocairo-1.0-0 \
    libasound2 libpng-dev libfontconfig1 fonts-liberation \
    ffmpeg chromium \
    libgtk-3-0 \
    fonts-noto-cjk \
    iputils-ping dnsutils nano curl vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) 複製 package.json + package-lock.json 並安裝依賴
COPY package*.json ./
RUN npm install

# 3) 複製專案其他檔案
COPY . .

# Puppeteer 設定：使用系統安裝好的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["npm", "start"]
