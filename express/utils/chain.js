// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

let contractABI = [];
let contract = null;
try {
  contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));
  contract = new web3.eth.Contract(contractABI, contractAddress);
  console.log('[chain] 合約ABI載入成功');
} catch(e){
  console.warn('[chain] 載入ABI失敗, fallback =>', e.message);
}

function getAccount(){
  const acct = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(acct);
  return acct;
}

async function writeToBlockchain(data){
  if(!contract){
    console.log('[chain] contract not loaded => return FAKE tx');
    return '0xFAKE_TX';
  }
  try {
    const account = getAccount();
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.storeData(data).encodeABI(),
      gas: 2000000
    };
    const receipt = await web3.eth.sendTransaction(tx);
    console.log('[chain] 上鏈成功, txHash=', receipt.transactionHash);
    return receipt.transactionHash;
  } catch(e){
    console.error('[chain] 上鏈錯誤:', e);
    throw e;
  }
}

module.exports = { writeToBlockchain };
