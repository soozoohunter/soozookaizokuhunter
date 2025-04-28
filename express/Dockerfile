# express/Dockerfile

FROM node:18

# 1) 安裝系統必要套件 (chromium + ffmpeg + fonts + Puppeteer 依賴)
#    + 安裝 ping / dnsutils / vim / curl 以利容器內除錯
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

# 2) 複製 package.json + package-lock.json
COPY package*.json ./

# (NEW) 先安裝 puppeteer-extra / puppeteer-extra-plugin-stealth / ffmpeg-static
#       以確保 package.json 若未記載，也能先行安裝
#       (若您已在 package.json dependencies 中宣告，就不需要這步了)
RUN npm install puppeteer-extra puppeteer-extra-plugin-stealth ffmpeg-static

# 3) 執行 npm install，安裝其他依賴
RUN npm install

# 4) 複製專案其他檔案 (包含 routes, utils, fonts 目錄等)
COPY . .

# Puppeteer 設定：使用系統安裝好的 /usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ★ GPU 加速設定 (若無需GPU可省略)
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics

EXPOSE 3000

CMD ["npm", "run", "start"]

# --- 使用說明 ---
# 1) docker compose build --no-cache suzoo_express
# 2) docker compose up -d
#
# 若需單獨測試此映像，可在 /express 執行:
#   docker build -t suzoo_express -f Dockerfile .
#   docker run --gpus all -p 3000:3000 suzoo_express
