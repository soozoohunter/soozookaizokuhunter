FROM ipfs/go-ipfs:latest

# 官方 ipfs/go-ipfs:latest 多半是 Alpine-based，因此使用 apk
USER root
RUN apk add --no-cache curl

USER ipfs

# 預設官方 entrypoint 已執行 ipfs daemon
# 只需確保我們曝光三個常用埠
EXPOSE 4001 5001 8080
