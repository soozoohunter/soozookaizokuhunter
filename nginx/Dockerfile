FROM nginx:alpine

# 1) 安裝必需套件：bash, netcat-openbsd, curl
RUN apk add --no-cache bash netcat-openbsd curl

WORKDIR /etc/nginx

# 2) 複製 wait-for-it.sh 並賦予執行權限
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 3) 複製您的自訂 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# 4) 容器將對外開放 80 與 443 連接埠
EXPOSE 80
EXPOSE 443

# 5) 最重要：CMD – 先後等待 express:3000 / fastapi:8000，皆就緒後執行 Nginx
CMD [
  "sh",
  "-c",
  "/wait-for-it.sh express:3000 --timeout=60 --strict && \
   /wait-for-it.sh fastapi:8000 --timeout=60 --strict && \
   nginx -g 'daemon off;'"
]
