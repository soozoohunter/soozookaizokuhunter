require('dotenv').config();
const { ethers } = require('ethers');

// 從 .env 獲取區塊鏈配置
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
// 合約 ABI 與位址
const contractABI = [
  /* TODO: 在此處貼上智慧合約 ABI 內容（JSON 陣列） */
];
const contractAddress = process.env.CONTRACT_ADDRESS;
// 建立合約實例，用於後續呼叫
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

/**
 * 將使用者註冊資訊寫入區塊鏈合約。
 * @param {string} userName - 用戶名稱
 * @param {string} role - 角色 (copyright/trademark/both)
 * @param {string} serialNumber - 用戶輸入的序號
 * @param {Object} accounts - 用戶綁定的社群/電商帳號物件
 */
async function registerUserOnBlockchain(userName, role, serialNumber, accounts) {
  // 將 accounts 物件轉為 JSON 字串，以便傳輸或儲存
  const accountsJson = JSON.stringify(accounts);
  // 調用智慧合約的 registerUser 函式 (需與合約定義匹配)
  // 假設合約函式定義為：function registerUser(string memory userName, string memory role, string memory accountsJson, string memory serialNumber) public
  const tx = await contract.registerUser(userName, role, accountsJson, serialNumber);
  await tx.wait();  // 等待交易寫入區塊鏈
  console.log(`Blockchain Tx Successful: ${tx.hash}`);
  return tx;
}

module.exports = { registerUserOnBlockchain };
