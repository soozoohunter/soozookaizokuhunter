/**
 * express/services/blockchainService.js
 * - 整合您的區塊鏈邏輯 (ethers + Ganache)
 * - registerUserOnBlockchain(...) 寫入合約
 */
require('dotenv').config();
const { ethers } = require('ethers');

// 從 .env 載入
const {
  BLOCKCHAIN_RPC_URL,      // e.g. http://suzoo_ganache:8545
  BLOCKCHAIN_PRIVATE_KEY,  // e.g. 0x012345...
  CONTRACT_ADDRESS         // e.g. 0x590CC0a45103883...
} = process.env;

// 建立 provider + wallet + contract
const provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
const wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);

// ★ 您的合約 ABI（請貼上實際 JSON）
const contractABI = [
  /* TODO: 在此處貼上智慧合約 ABI 內容（JSON 陣列） */
];
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

/**
 * registerUserOnBlockchain
 * @param {string} userName - 用戶名稱
 * @param {string} role - 用戶角色
 * @param {string} serialNumber - 產生或自定的序號
 * @param {object} accountsObj - { IG, FB, Shopee ... }
 */
async function registerUserOnBlockchain(userName, role, serialNumber, accountsObj) {
  try {
    const accountsJson = JSON.stringify(accountsObj);

    // 假設合約函數：registerUser(userName, role, accountsJson, serialNumber)
    const tx = await contract.registerUser(userName, role, accountsJson, serialNumber);
    await tx.wait(); // 等待上鏈
    console.log('[blockchainService] Tx success:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('[blockchainService] registerUserOnBlockchain error:', err);
    throw err;
  }
}

module.exports = { registerUserOnBlockchain };
