FROM trufflesuite/ganache-cli:latest

# 安裝 curl 工具，供健康檢查使用
RUN apk add --no-cache curl

CMD ["ganache-cli", "--host", "0.0.0.0", "--port", "8545", "--accounts", "5", "--defaultBalanceEther", "100"]
