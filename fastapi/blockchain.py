import os
from web3 import Web3
import ipfshttpclient
import base64

BLOCKCHAIN_RPC = os.getenv('BLOCKCHAIN_RPC')
BLOCKCHAIN_PRIVATE_KEY = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
INFURA_IPFS_PROJECT_ID = os.getenv('INFURA_IPFS_PROJECT_ID')
INFURA_IPFS_PROJECT_SECRET = os.getenv('INFURA_IPFS_PROJECT_SECRET')

# 區塊鏈初始化
w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC))
account = w3.eth.account.from_key(BLOCKCHAIN_PRIVATE_KEY)

def get_ipfs_client():
    """
    連線到 Infura IPFS Gateway
    https://ipfs.infura.io:5001
    """
    project_id = INFURA_IPFS_PROJECT_ID
    project_secret = INFURA_IPFS_PROJECT_SECRET
    # Infura的認證
    auth = (project_id + ":" + project_secret)
    infura_url = "/dns4/ipfs.infura.io/tcp/5001/https"
    return ipfshttpclient.connect(infura_url, auth=auth)

def upload_to_ipfs(data: bytes) -> str:
    """
    將檔案(或資料)上傳到Infura IPFS
    回傳IPFS CID
    """
    client = get_ipfs_client()
    # 可以直接把 bytes 寫入临时檔再上傳，這裡直接 base64
    tmp_file = "temp.bin"
    with open(tmp_file, "wb") as f:
        f.write(data)
    res = client.add(tmp_file)
    cid = res["Hash"]
    # 刪除暫存檔
    client.close()
    return cid

def upload_to_eth(data: bytes):
    """
    先上傳IPFS取得CID，然後把 CID 寫進交易 data
    """
    cid = upload_to_ipfs(data)
    cid_bytes = cid.encode('utf-8')

    nonce = w3.eth.get_transaction_count(account.address)
    tx = {
        'nonce': nonce,
        'to': account.address,  # 簡化處理
        'value': 0,
        'gas': 210000,          # 上調gas
        'gasPrice': w3.toWei('5', 'gwei'),
        'data': cid_bytes
    }
    signed_tx = w3.eth.account.sign_transaction(tx, BLOCKCHAIN_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.toHex(tx_hash)
