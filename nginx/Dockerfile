FROM nginx:alpine

# 安裝 netcat
RUN apk add --no-cache netcat-openbsd

# 複製 wait-for-it.sh
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

EXPOSE 80 443
CMD ["/wait-for-it.sh","crawler:8081","--timeout=30","--strict","--","nginx","-g","daemon off;"]
