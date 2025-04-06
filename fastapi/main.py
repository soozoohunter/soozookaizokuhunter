from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

# In-memory set to store seen fingerprints for duplicate detection
seen_fingerprints = set()

class ScanRequest(BaseModel):
    fingerprint: str

class ScanResponse(BaseModel):
    match: bool
    message: str = None

class AddIPFSRequest(BaseModel):
    url: str

class AddIPFSResponse(BaseModel):
    hash: str
    name: str = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/scan", response_model=ScanResponse)
def scan_fingerprint(data: ScanRequest):
    """Check if the given file fingerprint has been seen before."""
    fp = data.fingerprint
    if fp in seen_fingerprints:
        return {"match": True, "message": "File fingerprint already exists (possible duplicate)"} 
    # If not seen, add to set and return no match
    seen_fingerprints.add(fp)
    return {"match": False, "message": "No matching fingerprint found"}

@app.post("/add_ipfs", response_model=AddIPFSResponse)
def add_ipfs(data: AddIPFSRequest):
    """
    Add a file from a given URL to the IPFS node.
    Downloads the content and adds it to IPFS via the local node's API.
    """
    url = data.url
    try:
        resp = requests.get(url, timeout=10)
    except Exception as e:
        return {"hash": "", "name": None, "error": f"Failed to download URL: {e}"}
    if resp.status_code != 200:
        return {"hash": "", "name": None, "error": f"Failed to download URL: status {resp.status_code}"}
    file_content = resp.content
    file_name = url.split("/")[-1] or "file"
    # Send content to local IPFS node
    files = {'file': (file_name, file_content)}
    try:
        ipfs_resp = requests.post("http://ipfs:5001/api/v0/add", files=files)
        data = ipfs_resp.json()
        # IPFS response has "Hash" and "Name"
        return {"hash": data.get("Hash", ""), "name": data.get("Name", file_name)}
    except Exception as e:
        return {"hash": "", "name": file_name, "error": f"IPFS add failed: {e}"}
