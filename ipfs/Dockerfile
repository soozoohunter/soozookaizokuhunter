FROM ipfs/go-ipfs:latest

# 切換到 root，安裝 curl
USER root
RUN apt-get update && apt-get install -y curl

# 再切回 ipfs 用戶
USER ipfs

# 對外暴露三個常用埠
EXPOSE 4001 5001 8080

# 預設會執行 ipfs daemon (官方映像已設定)
# 無需自行 CMD，保持官方 entrypoint 即可
