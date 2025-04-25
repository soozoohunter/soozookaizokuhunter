# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) 安裝 ffmpeg (alpine)
RUN apk add --no-cache ffmpeg

# 2) 複製並安裝套件
COPY package*.json ./
RUN npm install

# 3) 複製字型 (若有)
COPY ./fonts /app/fonts

# 4) 複製整個 express 專案
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
