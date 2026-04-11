from google import genai
from google.genai import types

from app.core.config import settings


class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-3.1-flash-lite"
        self.embedding_model = "models/gemini-embedding-001"

    async def get_embedding(self, text: str) -> list[float]:
        result = await self.client.aio.models.embed_content(
            model=self.embedding_model,
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=768,
            ),
        )
        return result.embeddings[0].values

    async def generate_response(self, prompt: str, context: str) -> str:
        full_prompt = f"Context: {context}\n\nQuestion: {prompt}"
        response = await self.client.aio.models.generate_content(
            model=self.model_name, contents=full_prompt
        )
        if response.text:
            return response.text
        return "No response generated."


ai_service = AIService()
