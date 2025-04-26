# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg + chromium + 字體相關依賴
RUN apk add --no-cache ffmpeg \
    && apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# 2) 複製 package.json + package-lock.json，並安裝套件
COPY package*.json ./
RUN npm install

# 3) 複製單一 fonts/ 資料夾 → /app/fonts
#    (只保留 NotoSansTC-VariableFont_wght.ttf 這個檔案)
COPY ./fonts /app/fonts

# 4) 複製 public/ → /app/public (stamp.png)
COPY ./public /app/public

# 5) 複製其他 express 專案檔案 (routes, models, server.js, etc.)
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
