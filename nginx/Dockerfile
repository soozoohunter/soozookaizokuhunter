FROM nginx:alpine
RUN apk add --no-cache netcat-openbsd bash curl

WORKDIR /etc/nginx

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

CMD [
  "sh", "-c",
  "/wait-for-it.sh express:3000 --timeout=300 --strict && \
   /wait-for-it.sh crawler:8081 --timeout=300 --strict && \
   /wait-for-it.sh fastapi:8000 --timeout=300 --strict && \
   nginx -g 'daemon off;'"
]
