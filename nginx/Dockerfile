FROM nginx:alpine

# 安裝必要套件：bash、nc、curl
RUN apk add --no-cache bash netcat-openbsd curl

WORKDIR /etc/nginx

# 複製 wait-for-it.sh
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 複製 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

# 這裡同時等待 express:3000 & fastapi:8000，若都可連線再執行 Nginx
CMD [
  "sh",
  "-c",
  "/wait-for-it.sh express:3000 --timeout=60 --strict && \
   /wait-for-it.sh fastapi:8000 --timeout=60 --strict && \
   nginx -g 'daemon off;'"
]
