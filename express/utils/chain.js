// express/utils/chain.js
const Web3 = require('web3');

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

// 假設合約 ABI
const contractAbi = [
  {
    "inputs": [
      { "internalType": "string", "name": "_fingerprint", "type": "string" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" }
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let contract = null;
if (CONTRACT_ADDRESS) {
  contract = new web3.eth.Contract(contractAbi, CONTRACT_ADDRESS);
  console.log('[chain.js] Contract loaded =>', CONTRACT_ADDRESS);
} else {
  console.warn('[chain.js] No CONTRACT_ADDRESS found => return fakeTx');
}

async function storeRecord(fingerprint, ipfsHash='') {
  try {
    if (!contract || !PRIVATE_KEY) {
      console.warn('[chain.js] missing contract or privateKey => returning FAKE Tx');
      return { transactionHash: '0xFAKE_TX_HASH_123' };
    }
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    const data = contract.methods.storeRecord(fingerprint, ipfsHash).encodeABI();

    const tx = {
      from: account.address,
      to: CONTRACT_ADDRESS,
      data,
      gas: 300000
    };

    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('[chain.js] storeRecord =>', receipt.transactionHash);
    return { transactionHash: receipt.transactionHash };
  } catch (err) {
    console.error('[chain.js storeRecord error]', err);
    return null;
  }
}

module.exports = { storeRecord };
