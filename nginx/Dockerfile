FROM nginx:stable

# 複製我們自訂的 suzoo.conf
COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

# Optional Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
