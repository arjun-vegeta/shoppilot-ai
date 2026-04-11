from fastapi import APIRouter, HTTPException, Query

from app.services.retrieval import retrieval_service

router = APIRouter()


@router.get("/products")
async def search_products(
    q: str = Query(..., description="The search query"),
    limit: int = Query(5, ge=1, le=20),
    fts_weight: float = Query(0.4, ge=0.0, le=1.0),
    vector_weight: float = Query(0.6, ge=0.0, le=1.0),
):
    try:
        results = await retrieval_service.search_products(
            q, limit=limit, fts_weight=fts_weight, vector_weight=vector_weight
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
