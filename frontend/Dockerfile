#############################
# 1) Builder Stage: Node 16
#############################
FROM node:16-alpine AS build
WORKDIR /app

# 複製相依檔並安裝依賴
COPY package.json package-lock.json ./
RUN npm ci

# 複製其餘前端程式碼並執行建置
COPY . .
RUN npm run build

#############################
# 2) Production Stage: Nginx
#############################
FROM nginx:stable-alpine

# 移除 Nginx 預設設定
RUN rm -f /etc/nginx/conf.d/default.conf
# 刪除預設 www 根目錄檔案（若有）
RUN rm -rf /usr/share/nginx/html/*

# 複製自訂的 Nginx 設定檔 => 覆蓋 default.conf
COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 從前一階段複製打包產生的前端靜態檔案到 Nginx 預設路徑
COPY --from=build /app/build /usr/share/nginx/html

# 對外開放 80, 443
EXPOSE 80
EXPOSE 443

# 使用預設的 nginx:stable-alpine 進行前台模式
CMD ["nginx", "-g", "daemon off;"]
