from fastapi import APIRouter

router = APIRouter()

@router.get("/stats")
def analytics_stats():
    return {"message": "Analytics stats"}
