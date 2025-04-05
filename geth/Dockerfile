# 使用最新稳定版 (v1.13.5)
FROM ethereum/client-go:v1.13.5

# 安全加固：使用非root用户
RUN addgroup -g 1000 gethuser && \
    adduser -u 1000 -G gethuser -D gethuser

WORKDIR /geth

# 复制配置文件（最小权限原则）
COPY --chown=gethuser:gethuser genesis.json /geth/genesis.json
COPY --chown=gethuser:gethuser keystore/ /geth/keystore/
COPY --chown=gethuser:gethuser password.txt /geth/password.txt
COPY --chown=gethuser:gethuser init.sh /geth/init.sh

# 权限控制
RUN chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod 0700 /geth/keystore

USER gethuser

EXPOSE 8545 30303

ENTRYPOINT ["/geth/init.sh"]
