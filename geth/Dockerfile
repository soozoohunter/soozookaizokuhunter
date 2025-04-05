# 使用轻量级基础镜像
FROM alpine:3.18 as builder

# 安装必要工具
RUN apk add --no-cache geth curl jq

# 创建工作目录
WORKDIR /geth

# 复制配置文件（保持最小权限）
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt
COPY init.sh /geth/init.sh

# 严格权限控制
RUN chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod 0700 /geth/keystore

# 最终阶段
FROM ethereum/client-go:v1.10.26

# 从构建阶段复制文件
COPY --from=builder /geth /geth

# 暴露必要端口
EXPOSE 8545 30303 6060

# 健康检查（使用 exec 形式）
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -sf -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545 >/dev/null || exit 1

# 启动命令
ENTRYPOINT ["/geth/init.sh"]
