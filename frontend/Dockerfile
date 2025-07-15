# syntax=docker/dockerfile:1

########## 1️⃣ Build Stage ###############################################
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# 安裝依賴
RUN npm ci --legacy-peer-deps

COPY . .

# 接收來自 docker-compose.yml 的 ARG
ARG REACT_APP_API_URL
# 將 ARG 設置為環境變數，讓 React 應用程式可以讀取
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 產生正式版靜態檔
RUN npm run build

########## 2️⃣ Production Stage ##########################################
FROM nginx:alpine

# 將 React build 產物放進 Nginx 預設靜態目錄
COPY --from=builder /app/build /usr/share/nginx/html

# [★★ 關鍵修正 ★★] 修正 Nginx 設定檔的複製路徑
# Docker build 的 context 是 ./frontend，所以路徑要從 nginx/ 開始
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
