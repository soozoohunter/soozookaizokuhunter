// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

// 從 .env 讀取 RPC 與合約資訊
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const contractAddress = process.env.CONTRACT_ADDRESS || '';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0x012345...';

// 初始化 Web3
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 假設 ABI 檔案位於 express/contracts/KaiKaiShieldStorage.abi.json
const contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));
const contract = new web3.eth.Contract(contractABI, contractAddress);

/** 取得帳戶物件 */
function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  return account;
}

/** 將任意 data 字串寫入鏈上 */
async function writeToBlockchain(data) {
  const account = getAccount();
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(data).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/** 上傳檔案指紋 (dnaHash) + email */
async function writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
  const account = getAccount();
  const combined = `USER:${userEmail}|DNA:${dnaHash}|TYPE:${fileType}|TS:${timestamp}`;
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(combined).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/** 記錄侵權資訊 */
async function writeInfringementToChain(userEmail, infrInfo, timestamp) {
  const account = getAccount();
  const combined = `USER:${userEmail}|INFR:${infrInfo}|TS:${timestamp}`;
  const tx = {
    from: account.address,
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
