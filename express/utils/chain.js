const Web3 = require('web3');
require('dotenv').config();

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = require('../../contracts/KaiKaiShieldStorage.abi.json');

const contract = new web3.eth.Contract(contractABI, contractAddress);

async function writeToBlockchain(data) {
  const account = web3.eth.accounts.privateKeyToAccount(process.env.BLOCKCHAIN_PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(data).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

module.exports = { writeToBlockchain };
