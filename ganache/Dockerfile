FROM trufflesuite/ganache-cli:latest

# 安裝 curl 工具（因為健康檢查會使用 curl）
RUN apk add --no-cache curl

CMD ["ganache-cli", "--host", "0.0.0.0", "--port", "8545", "--accounts", "5", "--defaultBalanceEther", "100"]
