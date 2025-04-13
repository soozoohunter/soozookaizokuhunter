/********************************************************************
 * express/utils/chain.js (最終整合版)
 ********************************************************************/
require('dotenv').config();
const { ethers } = require('ethers');

/**
 * 從環境變數載入 RPC URL、私鑰、合約位址等，如未設定則給予預設或拋錯
 */
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.PRIVATE_KEY || '';
const contractAddress = process.env.CONTRACT_ADDRESS || '';  // 若未設置，則不啟用合約功能

// 初始化 ethers.js 提供者
let provider = null;
try {
  provider = new ethers.providers.JsonRpcProvider(rpcUrl);
} catch (err) {
  console.error(`初始化 JsonRpcProvider("${rpcUrl}") 失敗:`, err);
}

// 建立錢包
let wallet = null;
if (!privateKey) {
  console.warn("【警告】沒有提供 PRIVATE_KEY，區塊鏈寫入功能將無法使用。");
} else if (provider) {
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (err) {
    console.error("初始化 Wallet 失敗:", err);
  }
}

// 建立合約實例
// 以下範例 ABI 需替換為真實合約介面
const defaultABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address","name": "sender","type": "address"},
      { "indexed": false, "internalType": "string","name": "recordType","type": "string"},
      { "indexed": false, "internalType": "string","name": "data","type": "string"}
    ],
    "name": "RecordStored",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string","name": "recordType","type": "string" },
      { "internalType": "string","name": "data","type": "string" }
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let contract = null;
if (!contractAddress) {
  console.warn("【警告】沒有提供 CONTRACT_ADDRESS，將無法使用合約寫入功能。");
} else if (wallet) {
  try {
    contract = new ethers.Contract(contractAddress, defaultABI, wallet);
    console.log(`合約初始化成功 => ${contractAddress}`);
  } catch (err) {
    console.error("初始化合約失敗:", err);
  }
}

/**
 * 共同的寫入流程函式 (示範 storeRecord)
 * @param {string} recordType 例如 'GENERIC'、'ASSET'、'INFRINGE' 等
 * @param {string} data 要上鏈的文字
 */
async function storeRecord(recordType, data) {
  if (!contract) {
    const errMsg = "【區塊鏈錯誤】合約實例不存在或未初始化";
    console.error(errMsg);
    throw new Error(errMsg);
  }
  try {
    const tx = await contract.storeRecord(recordType, data);
    console.log(`[ETH] storeRecord(${recordType}, "${data}") TX =`, tx.hash);
    const receipt = await tx.wait();
    console.log(`[ETH] storeRecord => TX hash:`, receipt.transactionHash);
    return receipt.transactionHash;
  } catch (err) {
    console.error(`[storeRecord Error]`, err);
    throw err;
  }
}

/**
 * 匯出多個上鏈函式
 */
module.exports = {
  /**
   * 寫入一般資料: recordType = 'GENERIC'
   */
  async writeToBlockchain(data) {
    return await storeRecord('GENERIC', data);
  },

  /**
   * 上傳檔案 fingerprint
   */
  async writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
    const combined = `${userEmail}|${dnaHash}|${fileType}|${timestamp}`;
    return await storeRecord('ASSET', combined);
  },

  /**
   * 侵權舉報
   */
  async writeInfringementToChain(userEmail, infrInfo, timestamp) {
    const combined = `${userEmail}|${infrInfo}|${timestamp}`;
    return await storeRecord('INFRINGE', combined);
  },

  /**
   * 自訂
   */
  async writeCustomRecord(recordType, data) {
    return await storeRecord(recordType, data);
  }
};
