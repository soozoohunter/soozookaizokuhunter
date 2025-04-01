FROM nginx:alpine

# 安裝 bash / curl 以防 healthcheck 或 wait-for-it.sh 需要
RUN apk add --no-cache bash curl

WORKDIR /etc/nginx

# 複製 wait-for-it.sh
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
CMD ["/wait-for-it.sh","crawler:8081","--timeout=30","--strict","--","nginx","-g","daemon off;"]
