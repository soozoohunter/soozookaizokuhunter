import os
from web3 import Web3
import ipfshttpclient
import json
from datetime import datetime

BLOCKCHAIN_RPC = os.getenv('BLOCKCHAIN_RPC')
BLOCKCHAIN_PRIVATE_KEY = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
INFURA_IPFS_PROJECT_ID = os.getenv('INFURA_IPFS_PROJECT_ID')
INFURA_IPFS_PROJECT_SECRET = os.getenv('INFURA_IPFS_PROJECT_SECRET')

w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC))

try:
    account = w3.eth.account.from_key(BLOCKCHAIN_PRIVATE_KEY)
except Exception as e:
    account = None
    print("區塊鏈私鑰初始化失敗:", e)

def get_ipfs_client():
    auth = INFURA_IPFS_PROJECT_ID + ":" + INFURA_IPFS_PROJECT_SECRET
    infura_url = "/dns4/ipfs.infura.io/tcp/5001/https"
    return ipfshttpclient.connect(infura_url, auth=auth)

def upload_to_ipfs(data: bytes) -> str:
    client = get_ipfs_client()
    tmp_file = "temp.bin"
    with open(tmp_file, "wb") as f:
        f.write(data)
    res = client.add(tmp_file)
    cid = res["Hash"]
    client.close()
    return cid

def upload_to_eth(data: bytes, owner_id: int = 0):
    """
    將檔案上傳IPFS, 取得CID後, 連同owner, timestamp 以JSON寫入tx data
    """
    if not account:
        return "私鑰無效, 無法上鏈"

    cid = upload_to_ipfs(data)
    metadata = {
        "owner": owner_id,
        "timestamp": datetime.utcnow().isoformat(),
        "ipfs_cid": cid
    }
    tx_data = json.dumps(metadata).encode()

    nonce = w3.eth.get_transaction_count(account.address)
    tx = {
        'nonce': nonce,
        'to': account.address,
        'value': 0,
        'gas': 300000,
        'gasPrice': w3.toWei('5', 'gwei'),
        'data': tx_data
    }
    signed_tx = w3.eth.account.sign_transaction(tx, BLOCKCHAIN_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.toHex(tx_hash)
