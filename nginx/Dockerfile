FROM nginx:alpine
RUN apk add --no-cache netcat-openbsd bash

WORKDIR /etc/nginx

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
CMD ["/wait-for-it.sh","crawler:8081","--timeout=30","--strict","--","nginx","-g","daemon off;"]
