FROM node:18-alpine

# 安裝編譯工具並保留（根據實際需求）
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --production  # 嚴格依賴鎖定

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
