# express/Dockerfile

FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg、Puppeteer 所需瀏覽器依賴
RUN apk add --no-cache ffmpeg \
    && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製並安裝 Node.js 依賴
COPY package*.json ./
RUN npm install

# 3) 複製整個 express 專案檔案（含 routes, utils, fonts, public, etc.）
#    確保 express/ 下有 fonts/、public/ 等資料夾（若 stamp.png / TTF 檔存在）。
#    在 .dockerignore 排除 node_modules, .git 等不必要檔案。
COPY . .

# 4) 開放 port 3000
EXPOSE 3000

# 5) 啟動
CMD ["node", "server.js"]
