FROM nginx:1.27.4-alpine

# 1) 刪除官方預設的 default.conf，以免衝突
RUN rm -f /etc/nginx/conf.d/default.conf

# 2) 這裡**不**再 COPY default.conf，因為我們會用 docker-compose volumes 方式掛載
# COPY default.conf /etc/nginx/conf.d/default.conf

# 可選: 若你有 dhparam.pem 或其他 ssl 憑證檔，可 COPY

EXPOSE 80 443

# 預設 CMD
# (nginx 官方 image 預設就是 `nginx -g daemon off;`)
