require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const {
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS
} = process.env;

let web3;
let contract;

function initWeb3() {
  if (!web3) {
    web3 = new Web3(new Web3.providers.HttpProvider(BLOCKCHAIN_RPC_URL));
  }
  return web3;
}

function getContract() {
  if (!contract) {
    // 假設我們有合約 ABI，存放在 contracts/KaiKaiShieldStorage.json or .sol compile later
    // 這裡為範例，實務中會將 ABI 放 json 檔
    const abiPath = path.join(__dirname, '../../contracts/KaiKaiShieldStorage.abi.json');
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
  }
  return contract;
}

async function storeHashOnChain(hash) {
  // 這裡為範例：合約需要一個 function storeFileHash(bytes32 _hash)
  // 請確定您的合約KaiKaiShieldStorage.sol中有對應function
  try {
    const web3 = initWeb3();
    const contract = getContract();

    const account = web3.eth.accounts.wallet.add(BLOCKCHAIN_PRIVATE_KEY);

    const tx = contract.methods.storeFileHash(hash); // 假設 function storeFileHash
    const gas = await tx.estimateGas({ from: account.address });
    const txData = {
      from: account.address,
      to: CONTRACT_ADDRESS,
      data: tx.encodeABI(),
      gas
    };

    const receipt = await web3.eth.sendTransaction(txData);
    console.log('交易成功上鏈:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('上鏈失敗:', error.message);
    throw error;
  }
}

module.exports = {
  initWeb3,
  getContract,
  storeHashOnChain
};
