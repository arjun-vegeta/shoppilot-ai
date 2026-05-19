from typing import Any

import httpx
from ddgs import DDGS
from pydantic import BaseModel

from app.core.ai import ai_service


class LiveProductData(BaseModel):
    price: str | None = None
    stock_status: str | None = None
    latest_reviews: list[str] | None = None
    source_url: str


class EnrichmentService:
    def __init__(self):
        # Firecrawl removed in favor of DDGS + Jina Reader
        pass

    async def _get_markdown_content(self, url: str) -> str:
        """Fetch clean markdown content for free using Jina Reader."""
        jina_url = f"https://r.jina.ai/{url}"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"X-Return-Format": "markdown"}
                response = await client.get(jina_url, headers=headers)
                if response.status_code == 200:
                    return response.text
                return ""
        except Exception as e:
            print(f"Jina Reader Error for {url}: {e}")
            return ""

    async def get_live_data(self, url: str) -> dict[str, Any]:
        """
        Extract live price, stock, and reviews from a product URL
        using Jina Reader and Gemini.
        """
        markdown = await self._get_markdown_content(url)
        if not markdown:
            return {"success": False, "error": "Could not fetch page content"}

        prompt = f"""
        Extract the following structured data from this product page markdown:
        - Price (with currency symbol)
        - Stock Status (e.g., 'In Stock', 'Out of Stock')
        - Latest Reviews (A list of 3-5 latest user review headlines or content)

        Page Content:
        {markdown[:15000]}

        Return ONLY a JSON object with keys: "price", "stock_status", "latest_reviews".
        """

        try:
            raw_json = await ai_service.generate_response(
                prompt, "You are a data extraction expert."
            )
            # Basic cleanup of AI response to ensure it's just JSON
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].split("```")[0].strip()

            import json

            data = json.loads(raw_json)
            return {"success": True, "data": data}
        except Exception as e:
            print(f"Extraction Error: {e}")
            return {"success": False, "error": str(e)}

    async def get_product_sentiment(self, url_or_query: str) -> str:
        """
        Analyze the sentiment of a product based on its latest reviews.
        """
        url = url_or_query
        if not (url.startswith("http://") or url.startswith("https://")):
            print(f"DEBUG: Searching for URL for sentiment analysis: {url_or_query}")
            try:
                with DDGS() as ddgs:
                    results = list(
                        ddgs.text(
                            f"{url_or_query} reviews Amazon Flipkart", max_results=5
                        )
                    )
                    for res in results:
                        res_url = res["href"]
                        if "amazon" in res_url.lower() or "flipkart" in res_url.lower():
                            url = res_url
                            break
                    if url == url_or_query and results:
                        url = results[0]["href"]
            except Exception as e:
                print(f"Search failed during sentiment: {e}")

        if url == url_or_query and not (
            url.startswith("http://") or url.startswith("https://")
        ):
            return "Could not find a valid product page to analyze sentiment."

        data_res = await self.get_live_data(url)
        extracted = data_res.get("data", {})
        reviews = extracted.get("latest_reviews", [])

        if not reviews:
            return "No recent reviews found to analyze."

        review_text = "\n".join(reviews)
        prompt = (
            f"Based on these reviews, list the 3 main Pros and 3 main Cons "
            f"of this product in bullet points:\n\n{review_text}"
        )

        sentiment = await ai_service.generate_response(
            prompt, "You are a sentiment analysis expert."
        )
        return sentiment

    async def get_product_image(self, product_name: str) -> str | None:
        """Search for a product and return its main image URL."""
        try:
            url = ""
            with DDGS() as ddgs:
                # Find a product page first
                results = list(
                    ddgs.text(f"{product_name} official Amazon Flipkart", max_results=5)
                )
                for res in results:
                    res_url = res["href"]
                    if any(
                        d in res_url.lower()
                        for d in ["amazon.in", "flipkart.com", "apple.com", "sony.com"]
                    ):
                        url = res_url
                        break

            if not url:
                return None

            markdown = await self._get_markdown_content(url)
            prompt = (
                "Find the main product image URL in this markdown. "
                f"Return ONLY the raw URL string.\n\n{markdown[:5000]}"
            )
            img_url = await ai_service.generate_response(
                prompt, "You are an image URL extractor."
            )

            # Basic validation
            img_url = img_url.strip()
            if img_url.startswith("http"):
                return img_url
            return None
        except Exception as e:
            print(f"Get Product Image Error: {e}")
            return None

    async def compare_prices(self, product_name: str) -> list[dict[str, Any]]:
        """
        Search for a product on Amazon and Flipkart,
        then extract live data for comparison.
        """
        comparison_results = []
        platforms = [
            {"name": "amazon", "query": f"site:amazon.in {product_name}"},
            {"name": "flipkart", "query": f"site:flipkart.com {product_name}"},
        ]

        try:
            with DDGS() as ddgs:
                for platform in platforms:
                    print(f"Searching {platform['name']}...")
                    results = list(ddgs.text(platform["query"], max_results=3))
                    target_url = ""
                    for r in results:
                        if platform["name"] in r["href"].lower():
                            target_url = r["href"]
                            break

                    if target_url:
                        print(f"Scraping {platform['name']}: {target_url}")
                        data_res = await self.get_live_data(target_url)
                        if data_res.get("success"):
                            extracted = data_res["data"]
                            comparison_results.append(
                                {
                                    "platform": platform["name"],
                                    "url": target_url,
                                    "price": extracted.get("price"),
                                    "stock_status": extracted.get("stock_status"),
                                    "reviews": extracted.get("latest_reviews", []),
                                }
                            )

            return comparison_results
        except Exception as e:
            print(f"Comparison Error: {e}")
            return [{"error": str(e)}]


enrichment_service = EnrichmentService()
