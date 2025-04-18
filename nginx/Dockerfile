# 使用體積更小的 Alpine 版 Nginx
FROM nginx:stable-alpine

# 複製自訂設定
COPY suzoo.conf /etc/nginx/conf.d/suzoo.conf

# 健康檢查：確認 Nginx 回應
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 以上都準備好後，以非 daemon 模式啟動 Nginx（容器前景執行）
CMD ["nginx", "-g", "daemon off;"]
