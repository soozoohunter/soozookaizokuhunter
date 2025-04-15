require('dotenv').config();
const { ethers } = require('ethers');

// 智慧合約 ABI 定義（範例，只包含 registerUser 方法的介面）
const contractABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "serial", "type": "string" },
      { "name": "userName", "type": "string" },
      { "name": "email", "type": "string" }
    ],
    "name": "registerUser",
    "outputs": [],
    "type": "function"
  }
];

// 初始化以太坊提供者和錢包（簽署交易用）  
const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);

// 連接已部署的智慧合約實例 [oai_citation_attribution:4‡docs.ethers.org](https://docs.ethers.org/v5/api/contract/contract/#:~:text=Creating%20Instances)
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

/**
 * 將使用者資料寫入區塊鏈智慧合約。
 * @param {Object} userData - 包含 serialNumber, userName, email 的物件
 */
async function storeUserOnChain(userData) {
  try {
    // 調用智慧合約的 registerUser 方法發送交易
    const tx = await contract.registerUser(userData.serialNumber, userData.userName, userData.email);
    // 等待交易上鏈確認
    await tx.wait();
    console.log(`Blockchain tx successful: ${tx.hash}`);
    return true;
  } catch (err) {
    console.error('Blockchain error:', err);
    // 出現錯誤時拋出，以便上層處理交易回滾
    throw err;
  }
}

module.exports = { storeUserOnChain };
