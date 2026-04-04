from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.chat import router as chat_router
from app.api.v1.enrichment import router as enrichment_router
from app.api.v1.search import router as search_router
from app.core.config import settings

app = FastAPI(
    title="ShopPilot AI API",
    description="Backend for AI Commerce Research Agent",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(search_router, prefix="/api/v1", tags=["search"])
app.include_router(enrichment_router, prefix="/api/v1", tags=["enrichment"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Welcome to ShopPilot AI API"}
