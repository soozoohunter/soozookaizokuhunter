// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

// 讀 .env
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const contractAddress = process.env.CONTRACT_ADDRESS || '';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

// 初始化 Web3
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 假設 ABI 放在 express/contracts/KaiKaiShieldStorage.abi.json
const contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));

// 建立合約實例
const contract = (contractAddress)
  ? new web3.eth.Contract(contractABI, contractAddress)
  : null;

/** 取得帳戶 (私鑰 => account) */
function getAccount() {
  const acct = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(acct);
  return acct;
}

/** 寫入任意 data => storeData(data) */
async function writeToBlockchain(data) {
  if(!contract) throw new Error('合約地址或 contract 未設定');
  const acct = getAccount();
  const tx = {
    from: acct.address,
    to: contractAddress,
    data: contract.methods.storeData(data).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/** 上傳指紋 => storeData(...) */
async function writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
  if(!contract) throw new Error('合約地址或 contract 未設定');
  const acct = getAccount();
  const combined = `USER:${userEmail}|DNA:${dnaHash}|TYPE:${fileType}|TS:${timestamp}`;
  const tx = {
    from: acct.address,
    to: contractAddress,
    data: contract.methods.storeData(combined).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/** 侵權資訊 => storeData(...) */
async function writeInfringementToChain(userEmail, infrInfo, timestamp) {
  if(!contract) throw new Error('合約地址或 contract 未設定');
  const acct = getAccount();
  const combined = `USER:${userEmail}|INFR:${infrInfo}|TS:${timestamp}`;
  const tx = {
    from: acct.address,
    to: contractAddress,
    data: contract.methods.storeData(combined).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

module.exports = {
  writeToBlockchain,
  writeUserAssetToChain,
  writeInfringementToChain
};
