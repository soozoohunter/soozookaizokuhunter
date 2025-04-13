# 使用官方 Node LTS 映像檔作為基底 (或 node:18-slim)
FROM node:18-slim

WORKDIR /app

# 安裝系統套件(如需) 
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
