// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

// 初始化 Web3
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 嘗試載入合約 ABI
let contractABI = [];
let contract = null;

// 警告: 若 KaiKaiShieldStorage.abi.json 不存在、或路徑錯誤，會走 fallback
try {
  contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));
  contract = new web3.eth.Contract(contractABI, contractAddress);
  console.log('[chain] 合約 ABI 載入成功');
} catch (e) {
  console.warn('[chain] 載入合約ABI失敗 => fallback. msg=', e.message);
}

/**
 * getAccount():
 *   利用私鑰產生對應的 account 物件，並加到 web3.eth.accounts.wallet
 */
function getAccount() {
  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY 尚未在 .env 中設定');
  }
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  return account;
}

/**
 * 將 data 字串寫入合約 (storeData)
 * @param {string} data - 要上鏈的字串 (ex: "User=xxx|fp=yyy")
 * @return {string} txHash - 區塊鏈交易哈希
 */
async function writeToBlockchain(data) {
  // 若無合約 => 回傳 FAKE 交易哈希
  if (!contract) {
    console.log('[chain] contract not loaded => return FAKE TxHash');
    return '0xFAKE_TX_HASH_NO_CONTRACT';
  }

  try {
    // 取得 wallet 帳戶
    const account = getAccount();
    // 編碼呼叫
    const encodedABI = contract.methods.storeData(data).encodeABI();

    // 建立交易
    const tx = {
      from: account.address,
      to: contractAddress,
      data: encodedABI,
      gas: 2000000
    };

    // 送交易
    const receipt = await web3.eth.sendTransaction(tx);
    console.log('[chain] 寫入成功, txHash=', receipt.transactionHash);
    return receipt.transactionHash;

  } catch (err) {
    // 真實發生錯誤 => throw
    console.error('[chain] writeToBlockchain 錯誤:', err.message);
    throw err;
  }
}

module.exports = {
  writeToBlockchain
};
