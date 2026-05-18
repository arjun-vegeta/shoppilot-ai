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
        # 1. Get embedding for the query (with fallback)
        try:
            query_embedding = await ai_service.get_embedding(query)
        except Exception as e:
            print(f"Retrieval embedding error: {e}")
            # Fallback to zero vector if embedding fails (e.g., rate limit)
            query_embedding = [0.0] * 768

        # 2. Call Supabase RPC function for hybrid search
        response = self.supabase.rpc(
            "match_products",
            {
                "query_text": query,
                "query_embedding": query_embedding,
                "match_threshold": 0.2,
                "match_count": 200,  # Fetch a large batch for re-ranking
                "full_text_weight": fts_weight,
                "vector_weight": vector_weight,
            },
        ).execute()

        results = response.data

        # 3. Python-side re-ranking logic (Generic)
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        re_ranked = []

        # Accessory keywords to penalize if not in query
        accessory_terms = {
            "cable",
            "adapter",
            "remote",
            "mount",
            "stand",
            "case",
            "cover",
            "protector",
            "bracket",
            "charger",
            "pouch",
            "bag",
            "sleeve",
            "converter",
        }

        # Check if user is explicitly looking for an accessory
        is_searching_for_accessory = any(
            term in query_terms for term in accessory_terms
        )

        for r in results:
            boost = 1.0
            category = r.get("category", "").lower()
            title = r.get("title", "").lower()
            title_terms = set(title.replace("(", " ").replace(")", " ").split())

            # Handle NaN score from DB (poisoned by vector outage)
            score = r.get("hybrid_score", 0)
            if isinstance(score, str) and score == "NaN" or score is None or score == 0:
                fts_rank = float(r.get("fts_rank", 0))
                if fts_rank == 0 and any(term in title for term in query_terms):
                    score = 0.1
                else:
                    score = fts_rank / (fts_rank + 1) if fts_rank > 0 else 0.0

            # --- HEURISTIC 1: Direct Category Match ---
            # If query words appear in category, boost significantly
            if any(term in category for term in query_terms if len(term) > 2):
                boost *= 5.0

            # --- HEURISTIC 2: Accessory Penalty ---
            # If it's an accessory but the user didn't ask for one, penalize heavily
            if not is_searching_for_accessory:
                if any(term in title_terms for term in accessory_terms):
                    boost *= 0.05
                elif any(term in category for term in accessory_terms):
                    boost *= 0.1

            # --- HEURISTIC 3: Exact Word Match in Title ---
            # Boost if the query term is an exact word in the title
            # (not just a substring)
            if any(term in title_terms for term in query_terms):
                boost *= 2.0

            r["hybrid_score"] = float(score) * boost
            re_ranked.append(r)

        # Sort by boosted score, using rating and review count as tie-breakers
        re_ranked.sort(
            key=lambda x: (
                x["hybrid_score"],
                float(x.get("rating", 0) or 0),
                int(x.get("review_count", 0) or 0),
            ),
            reverse=True,
        )

        return re_ranked[:limit]


retrieval_service = RetrievalService()
