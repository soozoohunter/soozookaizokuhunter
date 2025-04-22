# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the built app with Nginx
FROM nginx:alpine
# 移除預設配置並複製自定義 Nginx 配置
RUN rm /etc/nginx/conf.d/default.conf
COPY suzoo.conf /etc/nginx/conf.d/
# 複製前端編譯結果至 Nginx 網站根目錄
COPY --from=build /app/build/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
