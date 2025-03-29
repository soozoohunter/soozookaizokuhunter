import os
from web3 import Web3
from solcx import compile_standard
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL","http://geth:8545")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY","0xabc123")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

def upload_to_chain(data: bytes):
    if not w3.is_connected():
        raise Exception("無法連線到以太坊節點")

    chain_id = w3.eth.chain_id
    expected_chain_id = 12345
    if chain_id != expected_chain_id:
        raise ValueError(f"鏈 ID 不匹配: 期望 {expected_chain_id}, 實際 {chain_id}")

    tx = {
      'nonce': w3.eth.get_transaction_count(account.address),
      'to': account.address,
      'value': 0,
      'gas': 210000,
      'gasPrice': w3.toWei('1', 'gwei'),
      'data': data,
      'chainId': expected_chain_id
    }
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return w3.toHex(tx_hash)
