# nginx/Dockerfile
FROM nginx:stable

# 將您修正後的 suzoo.conf 複製到 /etc/nginx/conf.d/
COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
