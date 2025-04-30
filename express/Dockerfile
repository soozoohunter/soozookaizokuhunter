FROM node:18

# 1) 安裝系統必要套件 (chromium + ffmpeg + 中文字體 + puppeteer 依賴)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg fonts-liberation fonts-noto-cjk \
    libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 \
    libxi6 libxtst6 libnss3 libglib2.0-0 libxrandr2 libatk1.0-0 \
    libdrm2 libgbm1 libpangocairo-1.0-0 libasound2 \
    iputils-ping dnsutils curl vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) 複製 package.json + package-lock.json (若有)，以便先行安裝依賴
COPY package*.json ./

# 如果您想確保安裝某些套件 (如 form-data) 可另外下指令，但因您 package.json 已有，這行可保留或移除
RUN npm install form-data@^4.0.0

# 3) 安裝其餘依賴 (包含 cheerio)
RUN npm install

# 4) 複製專案其他檔案
COPY . .

# Puppeteer: 指定使用系統安裝的 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

CMD ["npm", "start"]
