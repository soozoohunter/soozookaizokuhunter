# 建置階段：使用 Node.js 安裝與編譯 React 應用
FROM node:16-alpine AS build
WORKDIR /app

# 複製並安裝相依套件
COPY package*.json ./
RUN npm install

# 複製其餘專案原始碼並進行前端建置
COPY . . 
# 如有需要，可在此加入環境參數，例如：
# ARG PUBLIC_URL="/"
# ENV PUBLIC_URL=$PUBLIC_URL
RUN npm run build

# 部署階段：使用 Nginx 提供內容
FROM nginx:1.21-alpine
# 移除預設的 Nginx 設定與預設內容
RUN rm -rf /usr/share/nginx/html/* && rm /etc/nginx/conf.d/default.conf

# 從前一階段複製編譯出來的前端靜態檔至 Nginx 網頁根目錄
COPY --from=build /app/build /usr/share/nginx/html

# 複製自訂的 Nginx 設定檔，命名為 suzoo.conf 放入配置目錄
COPY nginx/suzoo.conf /etc/nginx/conf.d/suzoo.conf

# （非必須）開放容器埠號 80
EXPOSE 80

# 預設即啟動 Nginx 前景服務，因此无需另外指定 CMD
