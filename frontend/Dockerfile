#############################
# 1) Builder Stage
#############################
FROM node:16-alpine AS builder
WORKDIR /app

# 複製 package.json、package-lock.json (若有)
COPY package*.json ./
RUN npm install

# 複製整個前端專案
COPY . .

# 確認有 "build" script
RUN npm run build

#############################
# 2) Production Stage
#############################
FROM nginx:stable-alpine

# 將 /usr/share/nginx/html 清空
RUN rm -rf /usr/share/nginx/html/*

# 複製第一階段 build 出來的檔案至 /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html

# 複製自訂的 suzoo.conf => 覆蓋預設配置 (default.conf)
COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 開放 80, 443
EXPOSE 80
EXPOSE 443

# 前台執行 Nginx
CMD ["nginx", "-g", "daemon off;"]
