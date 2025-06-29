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
import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Form
from fastapi.responses import JSONResponse
from PIL import Image
import imagehash
from fpdf import FPDF
from web3 import Web3
from transformers import CLIPProcessor, CLIPModel
from pymilvus import connections, utility, Collection, CollectionSchema, FieldSchema, DataType

app = FastAPI()

# ====== 環境變數 ======
DB_HOST = os.getenv("POSTGRES_HOST", "suzoo_postgres")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "suzoo")
DB_USER = os.getenv("POSTGRES_USER", "suzoo")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
if not DB_PASSWORD:
    raise RuntimeError("POSTGRES_PASSWORD environment variable is required")

JWT_SECRET = os.getenv("JWT_SECRET")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUD_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUD_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# Milvus and model configuration for vector search
MILVUS_HOST = os.getenv("MILVUS_HOST", "suzoo_milvus")
MILVUS_PORT = int(os.getenv("MILVUS_PORT", 19530))
COLLECTION_NAME = "suzoo_image_vectors"
MODEL_NAME = "openai/clip-vit-base-patch32"

# 針對 IPFS，原本 "http://suzoo_ipfs:5001" 不符 multiaddr
# 需改成 /dns4/ + /tcp/ + /http
IPFS_API_URL = "/dns4/suzoo_ipfs/tcp/5001/http"

BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://suzoo_ganache:8545")
GANACHE_PRIV_KEY = os.getenv("GANACHE_PRIVATE_KEY", "")
CONTRACT_ADDR = os.getenv("CONTRACT_ADDRESS", "")

# === 連線 DB
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

# === Cloudinary
cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=CLOUD_API_KEY,
    api_secret=CLOUD_API_SECRET
)

# === Web3 (Ganache)
w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))

# 改用 w3.is_connected() 以相容新版 Web3
if w3.is_connected():
    print("[FastAPI] Ganache connected at", BLOCKCHAIN_RPC_URL)
else:
    print("[FastAPI] Ganache not connected:", BLOCKCHAIN_RPC_URL)

# 預設合約 ABI
contract = None
if CONTRACT_ADDR and GANACHE_PRIV_KEY and w3.is_connected():
    try:
        abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_fingerprint", "type": "string"},
                    {"internalType": "string", "name": "_ipfsHash", "type": "string"}
                ],
                "name": "storeRecord",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        contract = w3.eth.contract(address=CONTRACT_ADDR, abi=abi)
        print("[FastAPI] Contract loaded.")
    except Exception as e:
        print("[FastAPI] Contract init error:", e)

# === IPFS 連線 (以 multiaddr 方式)
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
        nonce = w3.eth.get_transaction_count(acct.address)
        tx_data = contract.functions.storeRecord(
            fingerprint, ipfsHash
        ).build_transaction({
            'from': acct.address,
            'nonce': nonce,
            'gas': 300000,
            'gasPrice': w3.to_wei('1', 'gwei')
        })
        signed_tx = w3.eth.account.sign_transaction(tx_data, private_key=GANACHE_PRIV_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return tx_hash.hex()
    except Exception as ex:
        print("Blockchain storeRecord error:", ex)
        return None

def verify_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_pdf_certificate(username, fingerprint, ipfs_cid, cloud_url, tx_hash):
    """產生 PDF 並上傳 Cloudinary"""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(0, 10, "SUZOO IP Guard - Blockchain Certificate", ln=1, align='C')

    pdf.set_font("Arial", size=12)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    txt = (
        f"Username: {username}\n"
        f"Timestamp (UTC): {now_str}\n"
        f"SHA256 Fingerprint: {fingerprint}\n"
        f"IPFS CID: {ipfs_cid}\n"
        f"Cloud URL: {cloud_url}\n"
        f"Blockchain TX: {tx_hash}\n"
        "Use this PDF as DMCA/infringement proof of origin.\n"
    )
    pdf.multi_cell(0, 8, txt)
    pdf_out = pdf.output(dest='S').encode('latin1')
    try:
        upres = cloudinary.uploader.upload(
            pdf_out,
            resource_type="raw",
            format="pdf"
        )
        return upres.get("secure_url")
    except Exception as ex:
        print("PDF upload error:", ex)
        return None

# ====== Vector Search Setup ======
# Load CLIP model once at startup
print(f"Loading model: {MODEL_NAME}...")
model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
print("Model loaded successfully.")

def get_milvus_collection():
    """Connect to Milvus and return the collection object"""
    try:
        if not connections.has_connection("default"):
            connections.connect(
                "default",
                host=MILVUS_HOST,
                port=MILVUS_PORT,
                timeout=60,  # increase timeout for slow startup environments
            )

        if not utility.has_collection(COLLECTION_NAME):
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=255),
                FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=512)
            ]
            schema = CollectionSchema(fields, "Image Similarity Search Collection")
            collection = Collection(name=COLLECTION_NAME, schema=schema)

            index_params = {"metric_type": "L2", "index_type": "IVF_FLAT", "params": {"nlist": 1024}}
            collection.create_index(field_name="vector", index_params=index_params)
        else:
            collection = Collection(name=COLLECTION_NAME)

        collection.load()
        return collection
    except Exception as e:
        print(f"Milvus connection/setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Milvus service is unavailable: {e}")

def image_to_vector(image: Image.Image):
    """Convert PIL image to feature vector"""
    inputs = processor(images=image, return_tensors="pt", padding=True)
    image_features = model.get_image_features(**inputs)
    vector = image_features[0].detach().numpy()
    return vector / (vector ** 2).sum() ** 0.5


@app.post("/api/v1/image-insert")
async def image_insert(id: str = Form(...), image: UploadFile = File(...)):
    try:
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")

        vector = image_to_vector(pil_image)

        collection = get_milvus_collection()

        entities = [{"id": id, "vector": vector.tolist()}]

        collection.insert(entities)
        collection.flush()

        print(f"Successfully inserted image with id: {id}")
        return {"success": True, "message": "Image indexed successfully", "id": id}
    except Exception as e:
        print(f"Error during image insert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/image-search")
async def image_search(top_k: int = Form(5), image: UploadFile = File(...)):
    try:
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")

        query_vector = image_to_vector(pil_image)

        collection = get_milvus_collection()
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}

        results = collection.search(
            data=[query_vector.tolist()],
            anns_field="vector",
            param=search_params,
            limit=top_k,
            output_fields=["id"]
        )

        response_data = []
        for hit in results[0]:
            response_data.append({"id": hit.entity.get('id'), "score": hit.distance})

        print(f"Search complete. Found {len(response_data)} results.")
        return {"success": True, "results": response_data}
    except Exception as e:
        print(f"Error during image search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "fastapi OK"}

# Dedicated healthcheck endpoint for container probes
@app.get("/healthz", status_code=200)
def health_check():
    return {"status": "ok"}

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
        raise HTTPException(status_code=401, detail="JWT missing userId")

    # 2) 檔案檢查
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")

    # 3) 指紋
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
        except Exception as ex:
            print("IPFS error:", ex)

    # 5) 上傳 Cloudinary
    cloud_url = None
    resource_type = "image"
    if file.content_type and file.content_type.startswith("video"):
        resource_type = "video"
    try:
        upres = cloudinary.uploader.upload(data, resource_type=resource_type)
        cloud_url = upres.get("secure_url")
    except Exception as ex:
        print("Cloudinary error:", ex)

    # 6) 侵權比對 (若需要使用 Reverse Image Search 可自行加)

    # 7) 區塊鏈存證
    tx_hash = None
    if contract:
        tx_hash = storeRecordOnChain(fingerprint, ipfs_cid or "")

    # 8) 產生 PDF
    pdf_url = generate_pdf_certificate(
        username,
        fingerprint,
        ipfs_cid or "-",
        cloud_url or "-",
        tx_hash or "-"
    )

    # 9) 寫入資料庫
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
    except Exception as ex:
        print("DB insert error:", ex)

    return JSONResponse({
        "fingerprint": fingerprint,
        "ipfs_cid": ipfs_cid,
        "cloudinary_url": cloud_url,
        "tx_hash": tx_hash,
        "certificate_url": pdf_url
    })
