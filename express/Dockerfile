# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 安裝 ffmpeg (alpine)
RUN apk add --no-cache ffmpeg

# 1) COPY package.json / package-lock.json
COPY package*.json ./
RUN npm install

# 2) COPY 字型： ./fonts -> /app/fonts
COPY ./fonts /app/fonts

# 3) COPY 整個 express 專案檔
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
