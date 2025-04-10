// 文件路徑: express/utils/chain.js

const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

// 從 .env 讀取 RPC URL
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';

// 從 .env 讀取合約地址 (建議必須設置)
const contractAddress = process.env.CONTRACT_ADDRESS || '';

// 從 .env 讀取私鑰 (EOA)
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

// 初始化 Web3
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 假設 ABI 檔案放在 express/contracts/KaiKaiShieldStorage.abi.json
// 若路徑不同，請自行修正
const contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));

// 生成合約實例
// 若 contractAddress 是空值，之後呼叫會失敗；建議一定要在 .env 設定好
const contract = new web3.eth.Contract(contractABI, contractAddress);

/**
 * 取得帳戶物件 (從 Private Key)
 */
function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account); // 把帳戶加進 web3 錢包管理
  return account;
}

/**
 * 將任意 data 字串寫入鏈上 (storeData)
 * @param {string} data 
 * @returns {string} txHash
 */
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

/**
 * 將使用者資產 (e.g. 圖片/短影音DNA) 上鏈
 * @param {string} userEmail
 * @param {string} dnaHash
 * @param {string} fileType
 * @param {string} timestamp
 * @returns {string} txHash
 */
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

/**
 * 將侵權資訊 (infrInfo) 上鏈
 * @param {string} userEmail
 * @param {string} infrInfo
 * @param {string} timestamp
 * @returns {string} txHash
 */
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
