// express/utils/chain.js

require('dotenv').config();
const { ethers } = require('ethers');

let provider = null;
let wallet = null;
let contract = null;

// 讀取 env
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || ''; 
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || ''; 
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// (A) 初始化 Provider
try {
  if (!RPC_URL) {
    console.warn("[chain.js] BLOCKCHAIN_RPC_URL not found in .env => skip provider init");
  } else {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    console.log("[chain.js] Provider connected =>", RPC_URL);
  }
} catch (err) {
  console.error("[chain.js] 初始化 provider 失敗:", err);
}

// (B) 初始化 Wallet
try {
  if (!PRIVATE_KEY) {
    console.warn("[chain.js] BLOCKCHAIN_PRIVATE_KEY not set => skip wallet init");
  } else if (!provider) {
    console.warn("[chain.js] Provider is null => skip wallet init");
  } else {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("[chain.js] Wallet init success =>", wallet.address);
  }
} catch (err) {
  console.error("[chain.js] 初始化 Wallet 失敗:", err);
}

// (C) 初始化合約 (此處為範例 ABI)
const defaultABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed":true,"internalType":"address","name":"sender","type":"address"},
      {"indexed":false,"internalType":"string","name":"recordType","type":"string"},
      {"indexed":false,"internalType":"string","name":"data","type":"string"}
    ],
    "name": "RecordStored",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType":"string","name":"recordType","type":"string"},
      {"internalType":"string","name":"data","type":"string"}
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

try {
  if (!CONTRACT_ADDRESS) {
    console.warn("[chain.js] CONTRACT_ADDRESS not set => skip contract init");
  } else if (!wallet) {
    console.warn("[chain.js] Wallet not inited => skip contract init");
  } else {
    contract = new ethers.Contract(CONTRACT_ADDRESS, defaultABI, wallet);
    console.log("[chain.js] 合約 init success =>", CONTRACT_ADDRESS);
  }
} catch (err) {
  console.error("[chain.js] 初始化合約失敗:", err);
}

// (D) 封裝 storeRecord (若 contract 為 null，則跳過)
async function storeRecord(recordType, data) {
  if (!contract) {
    throw new Error("[chain.js] contract is null, cannot storeRecord");
  }
  try {
    const tx = await contract.storeRecord(recordType, data);
    console.log(`[chain.js] storeRecord(${recordType}, ${data}), TX=`, tx.hash);
    const receipt = await tx.wait();
    console.log(`[chain.js] Mined =>`, receipt.transactionHash);
    return receipt.transactionHash;
  } catch (err) {
    console.error("[chain.js] storeRecord error:", err);
    throw err;
  }
}

// 匯出需要的 function
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
