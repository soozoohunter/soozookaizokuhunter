// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();

// 1) 讀取 RPC URL, 合約地址, 私鑰 等
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

// 2) 以 web3 HttpProvider 初始化
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 3) ABI 檔案 (假設放在 express/contracts/KaiKaiShieldStorage.abi.json)
const contractABI = require('../contracts/KaiKaiShieldStorage.abi.json');

// 建立合約實例
const contract = new web3.eth.Contract(contractABI, contractAddress);

/**
 * 從私鑰取得帳戶 & 加入 web3 wallet
 */
function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  return account;
}

/**
 * 寫入最原始的 data
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
 * 將使用者上傳檔案指紋 (DNAHash) 等資訊寫入鏈上
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
 * 將侵權資訊寫入鏈上
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

// 匯出
module.exports = {
  writeToBlockchain,
  writeUserAssetToChain,
  writeInfringementToChain
};
