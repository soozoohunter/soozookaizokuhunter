# express/Dockerfile

FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg (for 抽幀)、安裝 Puppeteer 所需瀏覽器依賴
RUN apk add --no-cache ffmpeg \
    && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# 3) 複製字體資料夾 (若確定有 express/fonts/)
RUN mkdir -p /app/fonts
COPY ./fonts /app/fonts || true

# 4) 複製 public/ (stamp.png 等)；若沒有此資料夾，可改用 || true 讓它不報錯
RUN mkdir -p /app/public
COPY ./public /app/public || true

# 5) 複製其餘 express 專案檔案 (routes, utils, services, etc.)
COPY . .

# 6) 開放對外 port
EXPOSE 3000

# 7) 啟動伺服器
CMD ["node", "server.js"]
