FROM ethereum/client-go:latest

WORKDIR /root
COPY genesis.json /root/genesis.json

# 初始化私有鏈
RUN mkdir -p /root/.ethereum
RUN geth --datadir /root/.ethereum init /root/genesis.json

# 只暴露RPC。若需要P2P連線到外部，也可 EXPOSE 30303 30303/udp
EXPOSE 8545
# EXPOSE 30303 30303/udp

# 保留一次 geth，不會再出現 'geth geth'。
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
