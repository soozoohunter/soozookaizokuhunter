FROM ethereum/client-go:latest

WORKDIR /root
COPY genesis.json /root/genesis.json

# 初始化私有鏈
RUN mkdir -p /root/.ethereum
RUN geth --datadir /root/.ethereum init /root/genesis.json

# 只暴露RPC (如要外部連接P2P，須再加 30303)
EXPOSE 8545

# 這裡只保留參數，不要再出現 "geth"
CMD [
  "--datadir", "/root/.ethereum",
  "--networkid", "12345",
  "--http",
  "--http.addr", "0.0.0.0",
  "--http.port", "8545",
  "--http.api", "eth,net,web3,personal",
  "--allow-insecure-unlock",
  "--unlock", "0xYOURADDRESS",
  "--password", "/dev/null"
]
