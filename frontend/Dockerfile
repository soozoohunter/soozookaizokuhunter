# frontend/Dockerfile

########################
# 1) Builder Stage
########################
FROM node:16-alpine AS builder

WORKDIR /app

# 先複製 package.json 和 package-lock.json
COPY package*.json ./

# ★ 在此鎖定 jwt-decode 版本（確保為 4.x）
RUN npm install jwt-decode@4.0.0

# 再安裝其他依賴
RUN npm install

# 複製剩餘前端程式碼
COPY . .

# 正式編譯
RUN npm run build

########################
# 2) Production Stage
########################
FROM nginx:alpine

# 直接將 build 出來的靜態檔部署到 Nginx 預設靜態目錄
COPY --from=builder /app/build /usr/share/nginx/html

# 若您有自訂 Nginx 配置，可放在 /etc/nginx/conf.d/*.conf
# 但通常 docker-compose 會掛載 suzoo.conf，這裡就不再重複

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
