FROM node:18

WORKDIR /app

# 安裝系統依賴(Chromium + 字型) + 清理
RUN apt-get update && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# 在 package.json 新增 "dotenv": "^16.0.3" (版本看你)
RUN npm install

COPY index.js ./

# Puppeteer 執行路徑
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 8081
CMD ["node","index.js"]
