# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 1) COPY package.json
COPY package*.json ./
RUN npm install

# 2) COPY 字型：本機的 ./fonts (同層) → 容器的 /app/fonts
COPY ./fonts /app/fonts

# 3) 再把整個 express 其他檔案複製過去
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
