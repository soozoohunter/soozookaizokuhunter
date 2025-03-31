FROM node:18

WORKDIR /app

# 1. 安裝系統依賴 (Chromium + 字型) 以支援 Puppeteer
RUN apt-get update && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
 && rm -rf /var/lib/apt/lists/*

# 2. 複製並安裝 npm 依賴 (包含 dotenv)
COPY package*.json ./
RUN npm install

# 3. 複製程式碼
COPY index.js ./

# 4. Puppeteer 環境變數 (告知可執行檔路徑)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 8081
CMD ["node", "index.js"]
