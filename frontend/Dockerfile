# frontend/Dockerfile
FROM node:18-slim

WORKDIR /app

# 安裝系統需求
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 複製 package.json (與 package-lock.json 若有) 並安裝相依套件
COPY package.json ./
# 若有 package-lock.json，建議一併COPY以鎖定版本：
# COPY package-lock.json ./

RUN npm install

# 複製前端原始碼
COPY . .

# 建置 React 專案
RUN npm run build

# 全域安裝 serve (提供靜態檔服務)
RUN npm install -g serve

# 指定容器對外埠號
EXPOSE 3000

# 預設啟動指令：使用 serve 提供 build 資料夾
CMD ["serve", "-s", "build", "-l", "3000"]
