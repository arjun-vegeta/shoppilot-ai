from app.core.ai import ai_service
from app.core.supabase import get_supabase


class RetrievalService:
    def __init__(self):
        self.supabase = get_supabase()

    async def search_products(
        self,
        query: str,
        limit: int = 5,
        fts_weight: float = 0.4,
        vector_weight: float = 0.6,
    ):
        # 1. Get embedding for the query
        query_embedding = await ai_service.get_embedding(query)

        # 2. Call Supabase RPC function for hybrid search
        response = self.supabase.rpc(
            "match_products",
            {
                "query_text": query,
                "query_embedding": query_embedding,
                "match_threshold": 0.2,
                "match_count": limit,
                "full_text_weight": fts_weight,
                "vector_weight": vector_weight,
            },
        ).execute()

        return response.data


retrieval_service = RetrievalService()
