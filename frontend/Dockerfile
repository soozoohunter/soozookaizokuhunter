########################
# 1) Builder Stage
########################
FROM node:16-alpine AS builder

WORKDIR /app

# 複製相依檔案，鎖定 jwt-decode@4.x（若您需要）
COPY package*.json ./
RUN npm install jwt-decode@4.0.0
RUN npm install

# 複製剩餘前端程式碼
COPY . .

# 建置生產版本
RUN npm run build

########################
# 2) Production Stage
########################
FROM node:16-alpine AS production

# 安裝 serve 以提供靜態檔案
RUN npm install -g serve

WORKDIR /app

# 從 builder 複製編譯結果
COPY --from=builder /app/build ./build

# 對外暴露容器的 3000 埠
EXPOSE 3000

# 以 serve 啟動，提供單頁應用程式 (SPA)
CMD ["serve", "-s", "build", "-l", "3000"]
