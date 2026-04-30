from collections.abc import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import settings
from app.services.enrichment import enrichment_service
from app.services.retrieval import retrieval_service


class AgentService:
    def __init__(self):
        # Initialize the new Google GenAI Client
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = "gemini-3.1-flash-lite"

        # Define the tools available to the agent
        self.tools = [
            self.search_catalog,
            self.get_live_product_data,
            self.compare_prices_across_platforms,
            self.get_product_sentiment,
        ]

    # Tool definitions
    async def search_catalog(self, query: str):
        """
        Search the internal product database for keyboards, mice, headphones,
        and other electronics. Use this when the user asks for recommendations
        or specific products we might have in stock.
        """
        results = await retrieval_service.search_products(query)
        # Simplify results
        simplified = [{"title": r["title"], "price": r["price"]} for r in results]
        return simplified

    async def get_live_product_data(self, url: str):
        """
        Scrape a specific URL to get the latest price, stock status, and reviews.
        Use this when a user provides a link or wants details on a specific
        external product page.
        """
        return await enrichment_service.get_live_data(url)

    async def compare_prices_across_platforms(self, product_name: str):
        """
        Find and compare prices for a product on Amazon and Flipkart India.
        Use this when the user wants to find the best deal or check live
        availability across major retailers.
        """
        return await enrichment_service.compare_prices(product_name)

    async def get_product_sentiment(self, product_url: str):
        """
        Analyze the sentiment of a product based on its latest reviews from a given URL.
        Returns a summary of Pros and Cons.
        """
        return await enrichment_service.get_product_sentiment(product_url)

    async def chat_stream(
        self, user_message: str, chat_history: list[dict] | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Manual streaming agentic loop with the new SDK for maximum reliability.
        """
        formatted_history = []
        if chat_history:
            for msg in chat_history:
                role = (
                    "model"
                    if msg.get("role") == "assistant"
                    else msg.get("role", "user")
                )
                formatted_history.append(
                    types.Content(
                        role=role, parts=[types.Part(text=msg.get("content", ""))]
                    )
                )

        chat = self.client.aio.chats.create(
            model=self.model_id,
            history=formatted_history,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are ShopPilot AI, a helpful shopping assistant. "
                    "When a user asks for products, ALWAYS use the "
                    "search_catalog tool. After you get the results, "
                    "you MUST describe the top products to the user "
                    "in a friendly way and ask if they want to know "
                    "more about any of them."
                ),
                tools=self.tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                ),
            ),
        )

        # Manual loop to handle tool calls
        current_message = user_message
        while True:
            print(f"DEBUG Loop: current_message={current_message}")
            found_tool_call = False
            tool_responses = []

            async for chunk in await chat.send_message_stream(current_message):
                if chunk.text:
                    print(f"DEBUG Chunk Text: {chunk.text}")
                    yield chunk.text

                # Check for tool calls in the candidate's parts
                if chunk.candidates and chunk.candidates[0].content.parts:
                    for part in chunk.candidates[0].content.parts:
                        if part.function_call:
                            print(f"DEBUG Tool Call Found: {part.function_call.name}")
                            found_tool_call = True
                            name = part.function_call.name
                            args = part.function_call.args

                            # Execute the tool
                            result = await self.execute_tool(name, args)
                            print(f"DEBUG Tool Result: {result}")

                            # Add to responses for this turn
                            tool_responses.append(
                                types.Part(
                                    function_response=types.FunctionResponse(
                                        name=name, response={"result": result}
                                    )
                                )
                            )

            if found_tool_call and tool_responses:
                # Feed ALL responses back as a single turn
                current_message = tool_responses
                # Continue the loop to get the model's reaction to the tool results
                continue
            else:
                print("DEBUG: No more tool calls, loop finished.")
                break

    async def execute_tool(self, name: str, args: dict):
        if name == "search_catalog":
            return await self.search_catalog(**args)
        elif name == "get_live_product_data":
            return await self.get_live_product_data(**args)
        elif name == "compare_prices_across_platforms":
            return await self.compare_prices_across_platforms(**args)
        elif name == "get_product_sentiment":
            return await self.get_product_sentiment(**args)
        return None


agent_service = AgentService()
