FROM alpine:3.17

# 指定要安裝的 IPFS(Kubo) 版本 (可自行調整)
ENV IPFS_VERSION=v0.19.1
ENV IPFS_PACKAGE=kubo_${IPFS_VERSION}_linux-amd64.tar.gz

# 1. 安裝 curl, tar, bash(可選) 等
RUN apk add --no-cache curl tar bash

# 2. 下載並解壓 IPFS (Kubo) 版本
RUN curl -L "https://dist.ipfs.tech/kubo/${IPFS_VERSION}/${IPFS_PACKAGE}" -o /tmp/ipfs.tgz \
    && tar -xvf /tmp/ipfs.tgz -C /tmp \
    && mv /tmp/kubo/ipfs /usr/local/bin/ipfs \
    && rm -rf /tmp/kubo /tmp/ipfs.tgz

# 3. 建立資料目錄
RUN mkdir -p /data/ipfs
ENV IPFS_PATH=/data/ipfs

# 4. 對外暴露三個常用埠
EXPOSE 4001 5001 8080

# 5. 預設啟動 ipfs daemon
ENTRYPOINT ["ipfs"]
CMD ["daemon", "--init", "--migrate"]
