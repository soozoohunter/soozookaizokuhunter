// express/utils/chain.js

require('dotenv').config();
const { ethers } = require('ethers');

// 從 env 載入
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const contractAddress = process.env.CONTRACT_ADDRESS || '';

// 初始化 provider
let provider = null;
try {
  provider = new ethers.providers.JsonRpcProvider(rpcUrl);
} catch (err) {
  console.error(`[chain.js] 初始化 JsonRpcProvider("${rpcUrl}") 失敗:`, err);
}

// 初始化 wallet
let wallet = null;
if (!privateKey) {
  console.warn("[chain.js] 沒有提供 PRIVATE_KEY，將無法執行區塊鏈寫入功能。");
} else if (provider) {
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (err) {
    console.error("[chain.js] 初始化 Wallet 失敗:", err);
  }
}

// 合約 ABI (請確保與您實際部署的合約一致)
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
  console.warn("[chain.js] 沒有提供 CONTRACT_ADDRESS，無法使用合約功能。");
} else if (wallet) {
  try {
    contract = new ethers.Contract(contractAddress, defaultABI, wallet);
    console.log(`[chain.js] 合約初始化成功 => ${contractAddress}`);
  } catch (err) {
    console.error("[chain.js] 初始化合約失敗:", err);
  }
}

async function storeRecord(recordType, data) {
  if (!contract) {
    throw new Error("[chain.js] 合約實例不存在或未初始化");
  }
  try {
    const tx = await contract.storeRecord(recordType, data);
    console.log(`[ETH] storeRecord(${recordType}, "${data}") TX=`, tx.hash);
    const receipt = await tx.wait();
    console.log(`[ETH] storeRecord => TX hash:`, receipt.transactionHash);
    return receipt.transactionHash;
  } catch (err) {
    console.error("[chain.js] storeRecord Error:", err);
    throw err;
  }
}

module.exports = {
  async writeToBlockchain(data) {
    return await storeRecord('GENERIC', data);
  },
  async writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
    const combined = `${userEmail}|${dnaHash}|${fileType}|${timestamp}`;
    return await storeRecord('ASSET', combined);
  },
  async writeInfringementToChain(userEmail, infrInfo, timestamp) {
    const combined = `${userEmail}|${infrInfo}|${timestamp}`;
    return await storeRecord('INFRINGE', combined);
  },
  async writeCustomRecord(recordType, data) {
    return await storeRecord(recordType, data);
  }
};
