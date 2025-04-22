################################################
# 1) Build stage: 使用 Node 建置 React
################################################
FROM node:16-alpine AS build
WORKDIR /app

# 複製 package.json 並安裝相依
COPY package*.json ./
RUN npm install

# 複製整個專案 (src, public等) 並執行 build
COPY . .
RUN npm run build

################################################
# 2) Production stage: 使用 Nginx 提供內容
################################################
FROM nginx:alpine

# 移除預設配置
RUN rm /etc/nginx/conf.d/default.conf

# 複製自訂的 Nginx 設定（確保檔案存在）
COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 複製React編譯後結果至Nginx靜態目錄
COPY --from=build /app/build /usr/share/nginx/html

# 若要在同一容器內使用 SSL，設定listen 443 + ssl_certificate
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
