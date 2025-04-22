#############################
# 1) Builder Stage
#############################
FROM node:16-alpine AS build
WORKDIR /app

# 複製 package.json、package-lock.json (若有)
COPY package*.json ./
RUN npm install

# 複製整個前端專案
COPY . .

# 編譯 React
RUN npm run build

#############################
# 2) Production Stage (Nginx)
#############################
FROM nginx:stable-alpine

# 清空預設 www
RUN rm -rf /usr/share/nginx/html/*

# 複製前階段產物
COPY --from=build /app/build /usr/share/nginx/html

# 複製自訂 Nginx 設定
COPY suzoo.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
