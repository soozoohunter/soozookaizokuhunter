// express/utils/chain.js
require('dotenv').config();
const { ethers } = require('ethers');

/**
 * 使用者可在 .env 中指定：
 *   BLOCKCHAIN_RPC_URL  (若未設，就用 'http://127.0.0.1:8545')
 *   BLOCKCHAIN_PRIVATE_KEY 或 PRIVATE_KEY
 *   CONTRACT_ADDRESS
 */
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || process.env.PRIVATE_KEY || '';
const contractAddress = process.env.CONTRACT_ADDRESS || '';

// 初始化 provider (v6 用法：new ethers.JsonRpcProvider)
let provider = null;
try {
  provider = new ethers.JsonRpcProvider(rpcUrl);
  console.log(`[chain.js] Provider init => ${rpcUrl}`);
} catch (err) {
  console.error(`[chain.js] 初始化 JsonRpcProvider("${rpcUrl}") 失敗:`, err);
}

// 初始化 wallet
let wallet = null;
if (!privateKey) {
  console.warn("[chain.js] 沒有提供 PRIVATE_KEY/BLOCKCHAIN_PRIVATE_KEY => 無法執行區塊鏈寫入");
} else if (!provider) {
  console.warn("[chain.js] provider 為 null => 跳過 wallet 初始化");
} else {
  try {
    wallet = new ethers.Wallet(privateKey, provider);
    console.log(`[chain.js] Wallet init => ${wallet.address}`);
  } catch (err) {
    console.error("[chain.js] 初始化 Wallet 失敗:", err);
  }
}

// 合約 ABI (示範)
const defaultABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "recordType", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "data", "type": "string" }
    ],
    "name": "RecordStored",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recordType", "type": "string" },
      { "internalType": "string", "name": "data", "type": "string" }
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let contract = null;
if (!contractAddress) {
  console.warn("[chain.js] 沒有提供 CONTRACT_ADDRESS => 無法初始化合約");
} else if (!wallet) {
  console.warn("[chain.js] wallet 為 null => 跳過合約初始化");
} else {
  try {
    contract = new ethers.Contract(contractAddress, defaultABI, wallet);
    console.log(`[chain.js] 合約初始化成功 => ${contractAddress}`);
  } catch (err) {
    console.error("[chain.js] 初始化合約失敗:", err);
  }
}

/**
 * 寫入合約 storeRecord(recordType, data)
 */
async function storeRecord(recordType, data) {
  if (!contract) {
    throw new Error("[chain.js] 合約實例不存在或未初始化");
  }
  try {
    const tx = await contract.storeRecord(recordType, data);
    console.log(`[ETH] storeRecord(${recordType}, "${data}"), TX=`, tx.hash);

    // 等待交易確認
    const receipt = await tx.wait();
    console.log(`[ETH] storeRecord => TX hash:`, receipt.transactionHash);

    return receipt.transactionHash;
  } catch (err) {
    console.error("[chain.js] storeRecord Error:", err);
    throw err;
  }
}

// 匯出多個上鏈函式
module.exports = {
  async writeToBlockchain(data) {
    // 例如 recordType='GENERIC'
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
