// services/blockchainService.js

'use strict';
require('dotenv').config();  // 確保讀取 .env 設定

const Web3 = require('web3');
const {
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS
} = process.env;

// 環境變數檢查
if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('缺少區塊鏈相關的環境變數設定 (.env)');
}

// 使用 HttpProvider 明確初始化
const web3 = new Web3(new Web3.providers.HttpProvider(BLOCKCHAIN_RPC_URL));

// 從私鑰取得錢包帳戶並加入 web3 錢包管理
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// 定義合約 ABI（需與實際部署的合約介面一致）
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_userName", "type": "string" },
      { "internalType": "string", "name": "_email", "type": "string" },
      { "internalType": "string", "name": "_serialNumber", "type": "string" },
      { "internalType": "string", "name": "_ig", "type": "string" },
      { "internalType": "string", "name": "_fb", "type": "string" },
      { "internalType": "string", "name": "_youtube", "type": "string" },
      { "internalType": "string", "name": "_tiktok", "type": "string" },
      { "internalType": "string", "name": "_shopee", "type": "string" },
      { "internalType": "string", "name": "_ruten", "type": "string" },
      { "internalType": "string", "name": "_ebay", "type": "string" },
      { "internalType": "string", "name": "_amazon", "type": "string" },
      { "internalType": "string", "name": "_taobao", "type": "string" }
    ],
    "name": "storeUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

/**
 * 將使用者資料寫入區塊鏈合約。
 * @param {Object} user 包含使用者資訊的物件
 * @returns {Promise<string>} 回傳交易的雜湊值
 */
async function storeUserOnChain(user) {
  const tx = contract.methods.storeUser(
    user.userName,
    user.email,
    user.serialNumber || '',
    user.ig || '',
    user.fb || '',
    user.youtube || '',
    user.tiktok || '',
    user.shopee || '',
    user.ruten || '',
    user.ebay || '',
    user.amazon || '',
    user.taobao || ''
  );

  const gas     = await tx.estimateGas({ from: account.address });
  const gasPrice = await web3.eth.getGasPrice();
  const receipt = await tx.send({ from: account.address, gas, gasPrice });

  console.log(`Blockchain Tx successful: ${receipt.transactionHash}`);
  return receipt.transactionHash;
}

/**
 * 查詢指定地址的以太餘額（Wei）
 * @param {string} address 以太坊地址
 * @returns {Promise<string>} 以 Wei 為單位的餘額字串
 */
async function getBalance(address) {
  return await web3.eth.getBalance(address);
}

module.exports = {
  web3,
  storeUserOnChain,
  getBalance
};
