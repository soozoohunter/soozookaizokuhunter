FROM nginx:stable

COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

# 健康檢查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
