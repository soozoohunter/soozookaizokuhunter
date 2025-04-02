from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def blockchain_status():
    return {"status": "Blockchain module working"}
