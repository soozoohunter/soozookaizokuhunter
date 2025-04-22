#############################
# 1) Builder Stage: Node 16
#############################
FROM node:16-alpine AS build
WORKDIR /app

# Copy package.json, package-lock.json (若您 lock file 已同步，則保留)
COPY package*.json ./

# 改用 npm install --production，避免因 lock file 不一致報錯
RUN npm install --production

# 複製其餘前端程式碼並執行建置
COPY . .
RUN npm run build

#############################
# 2) Production Stage: Nginx
#############################
FROM nginx:stable-alpine

# 移除 Nginx 預設設定
RUN rm -f /etc/nginx/conf.d/default.conf

# 刪除預設 www 根目錄檔案
RUN rm -rf /usr/share/nginx/html/*

# 複製自訂的 suzoo.conf => /etc/nginx/conf.d/default.conf
COPY suzoo.conf /etc/nginx/conf.d/default.conf

# 從 builder 階段複製打包好的靜態檔到 /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html

# 對外開放 80, 443
EXPOSE 80
EXPOSE 443

# 前台執行 Nginx
CMD ["nginx", "-g", "daemon off;"]
