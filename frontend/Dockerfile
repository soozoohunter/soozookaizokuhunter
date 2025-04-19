# 使用較小的 Node 映像進行建置階段
FROM node:16-alpine AS build

# 設定工作目錄並複製專案依賴檔案
WORKDIR /app
COPY package*.json ./
RUN npm install

# 複製其餘前端程式碼並進行生產版本建置
COPY . .
RUN npm run build

# 使用輕量級的 Node 映像作為產品階段，僅包含靜態檔案與伺服器
FROM node:16-alpine AS production

# 安裝 serve 套件作為靜態檔案伺服器
RUN npm install -g serve

# 複製前一階段的建置產物到容器中
WORKDIR /app
COPY --from=build /app/build ./build

# 將伺服器監聽埠設定為 3000（與 Nginx proxy 設定相符）
EXPOSE 3000

# 以 serve 啟動靜態文件伺服（SPA 模式確保對所有路徑提供 index.html）
CMD ["serve", "-s", "build", "-l", "3000"]
