from fastapi import APIRouter, HTTPException, Query

from app.services.enrichment import enrichment_service

router = APIRouter()


@router.get("/enrich")
async def enrich_product(
    url: str = Query(..., description="The product URL to scrape live data from"),
):
    """
    Get live price, stock, and reviews for a product URL.
    """
    try:
        data = await enrichment_service.get_live_data(url)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/compare")
async def compare_product(
    q: str = Query(..., description="The product name to search and compare"),
):
    """
    Search for a product on Amazon/Flipkart and return live price comparison.
    """
    try:
        results = await enrichment_service.compare_prices(q)
        return {"comparison": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/sentiment")
async def get_sentiment(
    url: str = Query(..., description="The product URL to analyze sentiment for"),
):
    """
    Get AI-generated sentiment analysis (Pros/Cons) for a product URL.
    """
    try:
        sentiment = await enrichment_service.get_product_sentiment(url)
        return {"sentiment": sentiment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
