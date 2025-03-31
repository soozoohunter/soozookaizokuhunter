# geth/Dockerfile
FROM ethereum/client-go:latest

WORKDIR /root

COPY genesis.json /root/genesis.json

RUN mkdir -p /root/.ethereum

# 注意：參數順序需先指定 --datadir，再放 genesis.json
RUN geth init --datadir /root/.ethereum /root/genesis.json

EXPOSE 30303 30303/udp 8545

# 這裡改為「單行 JSON」, 避免多行被 Docker parser 錯誤判定
CMD ["geth","--datadir","/root/.ethereum","--networkid","12345","--http","--http.addr","0.0.0.0","--http.port","8545","--http.api","eth,net,web3,personal","--allow-insecure-unlock","--dev","--unlock","0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8","--password","/dev/null"]