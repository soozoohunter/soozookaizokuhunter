import os
import io
import hashlib
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
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_NAME = os.getenv("POSTGRES_DB")

JWT_SECRET = os.getenv("JWT_SECRET")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUD_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUD_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

IPFS_API_URL = os.getenv("IPFS_API_URL", "http://suzoo_ipfs:5001")

# ==== 只使用 Ganache ====
GANACHE_URL = os.getenv("GANACHE_URL")  # 您在 .env 也請寫 GANACHE_URL=http://suzoo_ganache:8545
GANACHE_PRIVATE_KEY = os.getenv("GANACHE_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# ==== 連線資料庫 ====
db_conn = None
try:
    db_conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT,
        user=DB_USER, password=DB_PASSWORD,
        dbname=DB_NAME
    )
    db_conn.autocommit = True
    with db_conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                username VARCHAR(255),
                fingerprint VARCHAR(128),
                ipfs_cid VARCHAR(255),
                cloud_url VARCHAR(255),
                tx_hash VARCHAR(255),
                pdf_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
    print("FastAPI DB connected, 'uploads' table ready.")
except Exception as e:
    print("FastAPI DB error:", e)

# ==== Cloudinary ====
cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=CLOUD_API_KEY,
    api_secret=CLOUD_API_SECRET
)

# ==== IPFS 連線 ====
ipfs_client = None
try:
    ipfs_client = ipfshttpclient.connect(IPFS_API_URL)
    print("IPFS client connected to", IPFS_API_URL)
except Exception as e:
    print("IPFS connect error:", e)

# ==== Web3 (Ganache) ====
w3 = None
contract = None
if GANACHE_URL and GANACHE_PRIVATE_KEY and CONTRACT_ADDRESS:
    try:
        w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
        acct = w3.eth.account.from_key(GANACHE_PRIVATE_KEY)
        # 這裡請替換為您的合約 ABI
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
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
        print("FastAPI: web3 contract ready (Ganache).")
    except Exception as e:
        print("FastAPI: web3 init error:", e)

def storeRecordOnChain(fingerprint, ipfsHash):
    """呼叫 Ganache 合約 storeRecord(fingerprint, ipfsHash)，回傳 tx_hash"""
    if not contract or not w3:
        return None
    try:
        address = w3.eth.account.from_key(GANACHE_PRIVATE_KEY).address
        nonce = w3.eth.getTransactionCount(address)
        tx = contract.functions.storeRecord(fingerprint, ipfsHash).buildTransaction({
            'from': address,
            'nonce': nonce,
            'gas': 300000,
            'gasPrice': w3.toWei('1', 'gwei')
        })
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return tx_hash.hex()
    except Exception as e:
        print("Blockchain storeRecordOnChain error:", e)
        return None

def generate_certificate(username, fingerprint, ipfs_cid, cloud_url, tx_hash):
    """生成 DMCA / IP 所有權證明 PDF，並上傳到 Cloudinary"""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(0, 10, "DMCA / IP Original Content Certificate", ln=1, align='C')

    pdf.set_font("Arial", size=12)
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    pdf.cell(0, 8, f"Username: {username}", ln=1)
    pdf.cell(0, 8, f"Timestamp (UTC): {now}", ln=1)
    pdf.cell(0, 8, f"SHA256 Fingerprint: {fingerprint}", ln=1)
    pdf.cell(0, 8, f"IPFS CID: {ipfs_cid}", ln=1)
    pdf.cell(0, 8, f"Cloud URL: {cloud_url}", ln=1)
    pdf.cell(0, 8, f"Blockchain Tx: {tx_hash}", ln=1)
    pdf.cell(0, 8, "Use this PDF as your DMCA/infringement proof of origin.", ln=1)

    out_bytes = pdf.output(dest='S').encode('latin1')
    try:
        upres = cloudinary.uploader.upload(
            out_bytes,
            resource_type='raw',
            format='pdf'
        )
        return upres.get("secure_url")
    except Exception as e:
        print("PDF upload error:", e)
        return None

def verify_jwt(token):
    """驗證 JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@app.get("/health")
def health():
    return {"status": "fastapi-ok"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), authorization: str = Header(None)):
    """上傳檔案，進行 IPFS / Cloudinary / Ganache 上鏈 / RapidAPI 侵權比對 / PDF 證書。"""
    # 1) JWT 驗證
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing JWT in header")
    token = authorization.split(" ")[1]
    payload = verify_jwt(token)
    user_id = payload.get("userId")
    username = payload.get("username")
    if not user_id or not username:
        raise HTTPException(status_code=401, detail="JWT payload invalid")

    # 2) 檔案檢查
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    # 3) 指紋 (SHA-256)
    fingerprint = hashlib.sha256(content).hexdigest()

    # 4) IPFS
    ipfs_cid = None
    if ipfs_client:
        try:
            added = ipfs_client.add_bytes(content)
            if isinstance(added, bytes):
                ipfs_cid = added.decode('utf-8')
            elif isinstance(added, str):
                ipfs_cid = added
            else:
                ipfs_cid = added.get("Hash")
        except Exception as e:
            print("IPFS error:", e)

    # 5) 上傳 Cloudinary
    cloud_url = None
    fileType = "image"
    if (file.content_type or "").startswith("video"):
        fileType = "video"
    try:
        upres = cloudinary.uploader.upload(content, resource_type=fileType)
        cloud_url = upres.get("secure_url")
    except Exception as e:
        print("Cloudinary error:", e)

    # 6) 侵權比對 (僅圖片)
    matches = []
    if fileType == "image" and RAPIDAPI_KEY and cloud_url:
        try:
            headers = {
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": "reverse-image-search.p.rapidapi.com",
            }
            search_url = "https://reverse-image-search.p.rapidapi.com/"
            r = requests.get(search_url, headers=headers, params={"image_url": cloud_url}, timeout=15)
            if r.status_code == 200:
                data = r.json()
                if "results" in data:
                    for item in data["results"]:
                        link = item.get("url")
                        if link:
                            matches.append(link)
        except Exception as e:
            print("Reverse image search error:", e)

    # 7) Ganache 上鏈
    tx_hash = None
    if w3 and contract:
        tx_hash = storeRecordOnChain(fingerprint, ipfs_cid or "")

    # 8) 產生 PDF
    pdf_url = generate_certificate(username, fingerprint, ipfs_cid or "-", cloud_url or "-", tx_hash or "-")

    # 9) 寫DB
    try:
        if db_conn:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO uploads(user_id, username, fingerprint, ipfs_cid, cloud_url, tx_hash, pdf_url)
                    VALUES(%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (user_id, username, fingerprint, ipfs_cid, cloud_url, tx_hash, pdf_url)
                )
    except Exception as e:
        print("DB insert error:", e)

    # 10) 回傳
    return JSONResponse({
        "ipfs_cid": ipfs_cid,
        "cloudinary_url": cloud_url,
        "fingerprint": fingerprint,
        "tx_hash": tx_hash,
        "matches": matches,
        "certificate_url": pdf_url
    })
