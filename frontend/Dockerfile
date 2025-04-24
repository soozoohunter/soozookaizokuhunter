################################################
# 1) Build stage: 使用 Node 建置 React
################################################
FROM node:16-alpine AS build
WORKDIR /app

# 複製 package.json + package-lock.json (若有)
COPY package*.json ./
RUN npm install

# 複製整個前端專案 (src, public, etc.)
COPY . .

# 執行 React build
RUN npm run build

################################################
# 2) Production stage: 使用 Nginx 提供內容
################################################
FROM nginx:alpine

# 移除預設配置
RUN rm /etc/nginx/conf.d/default.conf || true

# 若您有自訂 suzoo.conf，就複製它
# COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 複製 React 編譯後結果
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
