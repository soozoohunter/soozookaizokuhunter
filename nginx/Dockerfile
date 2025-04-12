FROM nginx:stable

# 拷貝我們的 suzoo.conf 進入容器 (可在 compose 用 volume 方式亦可)
COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

# 健康檢查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1
