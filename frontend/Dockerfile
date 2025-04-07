FROM node:18-slim

WORKDIR /app

# 安裝 curl 以供健康檢查使用
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 複製 package.json 並安裝依賴
COPY package.json ./
RUN npm install

# 複製全部前端程式碼
COPY . .

# 建置 React 應用，生成 build 資料夾
RUN npm run build

# 全域安裝 serve 用於提供靜態檔案服務
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]