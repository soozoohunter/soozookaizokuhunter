# 建置階段（Build Stage）
FROM node:18-alpine AS builder
WORKDIR /app

# 1. 刪除可能存在的 node_modules 目錄和 package-lock.json，避免快取衝突
RUN rm -rf node_modules package-lock.json

# 2. 複製相依性檔案並安裝依賴（包含指定版本的 jwt-decode@3.1.2）
COPY package*.json ./
RUN npm install jwt-decode@3.1.2 && npm install

# 3. 複製應用程式原始碼並執行前端建置（React build）
COPY . .
RUN npm run build

# 執行階段（Production Stage）
FROM node:18-alpine
WORKDIR /app

# 4. 從建置階段複製編譯後的前端靜態資源
COPY --from=builder /app/build ./build

# 安裝 serve 套件供生產環境使用
RUN npm install -g serve

# 容器啟動應用：使用 serve 提供編譯出的前端頁面
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
