# nginx/Dockerfile
FROM nginx:alpine

# (1) 安裝 bash
RUN apk add --no-cache bash

# (2) 複製 wait-for-it.sh + 設置可執行權限
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# (3) 複製您自訂的 nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

# (4) 執行 wait-for-it.sh -> crawler:8081 -> nginx
CMD ["/wait-for-it.sh","crawler:8081","--timeout=30","--strict","--","nginx","-g","daemon off;"]
