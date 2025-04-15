// services/blockchainService.js

require('dotenv').config();  // 確保讀取 .env 設定

const Web3 = require('web3');
const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// 環境變數檢查
if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('缺少區塊鏈相關的環境變數設定 (.env)');
}

// 初始化 Web3 與區塊鏈連線
const web3 = new Web3(BLOCKCHAIN_RPC_URL);

// 從私鑰取得錢包帳戶並加入 web3 錢包管理
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
// 設定預設發送交易的帳戶
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
// 使用合約 ABI 和位址初始化合約物件
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

/**
 * 將使用者資料寫入區塊鏈合約。
 * @param {Object} user 包含使用者資訊的物件（userName, email, serialNumber, ig, fb, ... 等欄位）
 * @returns {Promise<string>} 回傳交易的雜湊值 (transaction hash)
 */
async function storeUserOnChain(user) {
  const { userName, email, serialNumber, ig, fb, youtube, tiktok, shopee, ruten, ebay, amazon, taobao } = user;
  try {
    // 準備交易資料: 呼叫合約的 storeUser 方法
    const tx = contract.methods.storeUser(
      userName, 
      email, 
      serialNumber, 
      ig || '', 
      fb || '', 
      youtube || '', 
      tiktok || '', 
      shopee || '', 
      ruten || '', 
      ebay || '', 
      amazon || '', 
      taobao || ''
    );

    // 估算所需的 gas 值
    const gas = await tx.estimateGas({ from: account.address });
    // 獲取目前網路建議的 gas price
    const gasPrice = await web3.eth.getGasPrice();

    // 使用錢包帳戶發送交易（自動簽署）
    const receipt = await tx.send({ 
      from: account.address, 
      gas, 
      gasPrice 
    });

    console.log(`Blockchain Tx successful: ${receipt.transactionHash}`);
    return receipt.transactionHash;
  } catch (err) {
    console.error('Error in storeUserOnChain:', err);
    throw err;
  }
}

module.exports = { storeUserOnChain };
