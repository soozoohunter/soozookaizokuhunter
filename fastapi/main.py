import os
import hashlib
import datetime
import jwt
import requests
import cloudinary
import cloudinary.uploader
import ipfshttpclient
import psycopg2
import psycopg2.extras
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.responses import JSONResponse
from PIL import Image
import imagehash
from fpdf import FPDF
from web3 import Web3

app = FastAPI()

# ====== 環境變數 ======
DB_HOST = os.getenv("POSTGRES_HOST", "suzoo_postgres")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "suzoo")
DB_USER = os.getenv("POSTGRES_USER", "suzoo")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "KaiShieldDbPass2023!")

JWT_SECRET = os.getenv("JWT_SECRET")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUD_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUD_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

IPFS_API_URL = os.getenv("IPFS_API_URL", "http://suzoo_ipfs:5001")

GANACHE_URL = os.getenv("GANACHE_URL", "http://suzoo_ganache:8545")
GANACHE_PRIV_KEY = os.getenv("GANACHE_PRIVATE_KEY", "")
CONTRACT_ADDR = os.getenv("CONTRACT_ADDRESS", "")

# === 連線資料庫 ===
db_conn = None
try:
    db_conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    db_conn.autocommit = True
    print("[FastAPI] Connected to Postgres.")
except Exception as e:
    print("[FastAPI] DB connect error:", e)

# === Cloudinary ===
cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=CLOUD_API_KEY,
    api_secret=CLOUD_API_SECRET
)

# === Web3 (Ganache) ===
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# ★ 改用 w3.isConnected() 以相容舊版 Web3
if w3.isConnected():
    print("[FastAPI] Ganache connected at", GANACHE_URL)
else:
    print("[FastAPI] Ganache not connected:", GANACHE_URL)

# 預設合約 ABI (可自行替換)
contract = None
if CONTRACT_ADDR and GANACHE_PRIV_KEY and w3.isConnected():
    try:
        abi = [
            {
                "inputs": [
                    {"internalType":"string","name":"_fingerprint","type":"string"},
                    {"internalType":"string","name":"_ipfsHash","type":"string"}
                ],
                "name":"storeRecord",
                "outputs":[],
                "stateMutability":"nonpayable",
                "type":"function"
            }
        ]
        contract = w3.eth.contract(address=CONTRACT_ADDR, abi=abi)
        print("[FastAPI] Contract loaded.")
    except Exception as e:
        print("[FastAPI] Contract init error:", e)

# === IPFS 連線 (可選) ===
ipfs_client = None
try:
    ipfs_client = ipfshttpclient.connect(IPFS_API_URL)
    print("[FastAPI] IPFS connected:", IPFS_API_URL)
except Exception as e:
    print("[FastAPI] IPFS connect error:", e)

def storeRecordOnChain(fingerprint, ipfsHash):
    """呼叫 Ganache 合約 storeRecord(fingerprint, ipfsHash)"""
    if not contract or not w3:
        return None
    try:
        acct = w3.eth.account.from_key(GANACHE_PRIV_KEY)
        nonce = w3.eth.getTransactionCount(acct.address)
        tx_data = contract.functions.storeRecord(fingerprint, ipfsHash).buildTransaction({
            'from': acct.address,
            'nonce': nonce,
            'gas': 300000,
            'gasPrice': w3.toWei('1','gwei')
        })
        signed_tx = w3.eth.account.sign_transaction(tx_data, private_key=GANACHE_PRIV_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return tx_hash.hex()
    except Exception as e:
        print("Blockchain storeRecord error:", e)
        return None

def verify_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_pdf_certificate(username, fingerprint, ipfs_cid, cloud_url, tx_hash):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(0,10,"SUZOO IP Guard - Blockchain Certificate", ln=1, align='C')

    pdf.set_font("Arial", size=12)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    txt = (
      f"Username: {username}\n"
      f"Timestamp (UTC): {now_str}\n"
      f"SHA256 Fingerprint: {fingerprint}\n"
      f"IPFS CID: {ipfs_cid}\n"
      f"Cloud URL: {cloud_url}\n"
      f"Blockchain TX: {tx_hash}\n"
      "Use this PDF for DMCA/infringement proof."
    )
    pdf.multi_cell(0,8,txt)
    pdf_out = pdf.output(dest='S').encode('latin1')
    try:
        upres = cloudinary.uploader.upload(pdf_out, resource_type="raw", format="pdf")
        return upres.get("secure_url")
    except Exception as e:
        print("PDF upload error:", e)
        return None

@app.get("/health")
def health():
    """健康檢查"""
    return {"status": "fastapi OK"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), authorization: str = Header(None)):
    """上傳檔案 => IPFS => Cloudinary => Ganache => PDF => DB"""
    # 1) JWT 驗證
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing JWT")
    token = authorization.split(" ")[1]
    payload = verify_jwt(token)
    user_id = payload.get("userId")
    username = payload.get("username")
    if not user_id:
        raise HTTPException(status_code=401, detail="JWT invalid userId")

    # 2) 檔案
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File empty")

    # 3) 指紋 (SHA-256)
    fingerprint = hashlib.sha256(data).hexdigest()

    # 4) IPFS
    ipfs_cid = None
    if ipfs_client:
        try:
            added = ipfs_client.add_bytes(data)
            if isinstance(added, bytes):
                ipfs_cid = added.decode('utf-8')
            elif isinstance(added, str):
                ipfs_cid = added
            elif isinstance(added, dict) and 'Hash' in added:
                ipfs_cid = added['Hash']
        except Exception as e:
            print("IPFS error:", e)

    # 5) 上傳 Cloudinary
    cloud_url = None
    rtype = "image"
    if (file.content_type or "").startswith("video"):
        rtype = "video"
    try:
        upres = cloudinary.uploader.upload(data, resource_type=rtype)
        cloud_url = upres.get("secure_url")
    except Exception as e:
        print("Cloudinary error:", e)

    # 6) RapidAPI 侵權比對 (略)

    # 7) 區塊鏈
    tx_hash = None
    if contract:
        tx_hash = storeRecordOnChain(fingerprint, ipfs_cid or "")

    # 8) 產生 PDF
    pdf_url = generate_pdf_certificate(
        username, fingerprint,
        ipfs_cid or "-",
        cloud_url or "-",
        tx_hash or "-"
    )

    # 9) 寫 DB
    try:
        if db_conn:
            with db_conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO uploads(
                      user_id, username, fingerprint, ipfs_cid,
                      cloud_url, tx_hash, pdf_url
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (user_id, username, fingerprint, ipfs_cid, cloud_url, tx_hash, pdf_url))
    except Exception as e:
        print("DB insert error:", e)

    return JSONResponse({
        "fingerprint": fingerprint,
        "ipfs_cid": ipfs_cid,
        "cloudinary_url": cloud_url,
        "tx_hash": tx_hash,
        "certificate_url": pdf_url
    })
