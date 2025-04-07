FROM node:18-slim

WORKDIR /app

# 安裝 curl 以供健康檢查使用
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 複製依賴定義檔並安裝依賴
COPY package*.json ./
RUN npm install

# 複製全部程式碼
COPY . .

EXPOSE 3000

CMD ["npm", "start"]