# syntax=docker/dockerfile:1

########## 1️⃣ Build Stage ###############################################
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# 使用 ci 可以確保依賴版本的一致性
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

# 使用自定義的 nginx.conf 覆蓋預設設定檔
COPY frontend/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

# 使用 Nginx 的標準啟動方式
CMD ["nginx", "-g", "daemon off;"]
