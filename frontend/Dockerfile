################################################
# 1) Build stage: 使用 Node 建置 React
################################################
FROM node:16-alpine AS build
WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm install

# 複製整個前端專案 (src, public, etc.)
COPY . .

# 打包 (build) React
RUN npm run build

################################################
# 2) Production stage: 使用 Nginx 提供內容
################################################
FROM nginx:alpine

# 刪除預設配置，以便我們手動掛載 suzoo.conf（若您有自定配置）
RUN rm /etc/nginx/conf.d/default.conf || true

# 將第一階段編譯後的檔案搬到 /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html

# Expose ports
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
