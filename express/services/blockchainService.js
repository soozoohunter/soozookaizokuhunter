/********************************************************************
 * services/blockchainService.js
 ********************************************************************/
require('dotenv').config();
const Web3 = require('web3');

const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error('缺少區塊鏈設定：請確認 .env 裡 BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS');
}

const web3 = new Web3(new Web3.providers.HttpProvider(BLOCKCHAIN_RPC_URL));
const account = web3.eth.accounts.privateKeyToAccount(BLOCKCHAIN_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// 依您合約實際 ABI
const contractABI = [
  // ...
];
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

async function storeUserOnChain(user) {
  const { userName, email, serialNumber } = user;
  const tx = contract.methods.storeUser(userName, email, serialNumber);
  const gas = await tx.estimateGas({ from: account.address });
  const gasPrice = await web3.eth.getGasPrice();

  const receipt = await tx.send({ from: account.address, gas, gasPrice });
  console.log(`Tx hash: ${receipt.transactionHash}`);
  return receipt.transactionHash;
}

module.exports = { storeUserOnChain };
