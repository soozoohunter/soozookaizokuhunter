FROM nginx:stable

# 拷貝 suzoo.conf 到 /etc/nginx/conf.d/
COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

# 健康檢查可自行加
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1
