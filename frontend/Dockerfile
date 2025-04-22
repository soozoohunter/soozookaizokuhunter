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
# 2) Production Stage (Nginx)
#############################
FROM nginx:stable-alpine

# 刪除預設 index
RUN rm -rf /usr/share/nginx/html/*

# 從 builder 拷貝 build 出來的前端靜態檔案
COPY --from=builder /app/build /usr/share/nginx/html

# 複製自訂的 suzoo.conf（SSL + SPA fallback）
COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 開放 80, 443 埠
EXPOSE 80
EXPOSE 443

# 前台執行 Nginx
CMD ["nginx", "-g", "daemon off;"]
