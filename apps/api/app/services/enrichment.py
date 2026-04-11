from typing import Any

from firecrawl import AsyncFirecrawl
from pydantic import BaseModel

from app.core.ai import ai_service
from app.core.config import settings


class LiveProductData(BaseModel):
    price: str | None = None
    stock_status: str | None = None
    latest_reviews: list[str] | None = None
    source_url: str


class EnrichmentService:
    def __init__(self):
        self.app = AsyncFirecrawl(api_key=settings.FIRECRAWL_API_KEY)

    async def get_live_data(self, url: str) -> dict[str, Any]:
        """
        Extract live price, stock, and reviews from a product URL using Firecrawl.
        """
        try:
            # Using the v2 'extract' method for structured data
            schema = {
                "type": "object",
                "properties": {
                    "price": {"type": "string"},
                    "stock_status": {"type": "string"},
                    "latest_reviews": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "A list of 3-5 latest user review contents or headlines."
                        ),
                    },
                },
                "required": ["price", "stock_status"],
            }

            # extract() takes a list of URLs
            result = await self.app.extract(
                [url],
                prompt=(
                    "Find the product price, stock availability, and any user "
                    "feedback, comments, or reviews. Even if the reviews are "
                    "just headlines, extract at least 3 of them."
                ),
                schema=schema,
            )
            return result
        except Exception as e:
            print(f"Firecrawl Error: {e}")
            return {"error": str(e)}

    async def get_product_sentiment(self, url_or_query: str) -> str:
        """
        Analyze the sentiment of a product based on its latest reviews.
        If a URL is provided, it scrapes it directly.
        If a product name is provided, it searches for a URL first.
        Returns a summary of Pros and Cons.
        """
        url = url_or_query
        # Basic URL check
        if not (url.startswith("http://") or url.startswith("https://")):
            print(f"DEBUG: Searching for URL for sentiment analysis: {url_or_query}")
            search_query = f"{url_or_query} reviews Amazon Flipkart India"
            search_results = await self.app.search(search_query)

            web_results = []
            if hasattr(search_results, "web"):
                web_results = search_results.web
            elif isinstance(search_results, dict):
                web_results = search_results.get("web", []) or search_results.get(
                    "data", []
                )

            for res in web_results:
                res_url = (
                    getattr(res, "url", "")
                    if not isinstance(res, dict)
                    else res.get("url", "")
                )
                if "amazon" in res_url.lower() or "flipkart" in res_url.lower():
                    url = res_url
                    print(f"DEBUG: Found URL for sentiment: {url}")
                    break

            if url == url_or_query:
                # Still no URL found
                if web_results:
                    url = (
                        getattr(web_results[0], "url", "")
                        if not isinstance(web_results[0], dict)
                        else web_results[0].get("url", "")
                    )
                else:
                    return "Could not find a valid product page to analyze sentiment."

        data = await self.get_live_data(url)

        extracted = {}
        if isinstance(data, dict):
            extracted = data.get("data", {})
        else:
            extracted = getattr(data, "data", {})

        reviews = (
            extracted.get("latest_reviews")
            if isinstance(extracted, dict)
            else getattr(extracted, "latest_reviews", [])
        )

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
        """
        Search for a product and return its main image URL.
        """
        try:
            search_query = f"{product_name} official product image"
            # search() returns metadata including thumbnails/images sometimes,
            # or we can scrape the first relevant result.
            search_results = await self.app.search(search_query)

            web_results = []
            if hasattr(search_results, "web"):
                web_results = search_results.web
            elif isinstance(search_results, dict):
                web_results = search_results.get("web", []) or search_results.get(
                    "data", []
                )

            if web_results:
                # Scrape the first relevant-looking e-commerce or official link
                for res in web_results:
                    url = (
                        getattr(res, "url", "")
                        if not isinstance(res, dict)
                        else res.get("url", "")
                    )
                    if any(
                        d in url.lower()
                        for d in [
                            "amazon",
                            "flipkart",
                            "apple.com",
                            "sony.com",
                            "logitech.com",
                            "samsung.com",
                            "dell.com",
                        ]
                    ):
                        print(f"DEBUG Scraping image from: {url}")
                        # Extract image specifically
                        schema = {
                            "type": "object",
                            "properties": {
                                "main_image_url": {
                                    "type": "string",
                                    "description": (
                                        "The URL of the primary product image."
                                    ),
                                }
                            },
                            "required": ["main_image_url"],
                        }
                        scrape_res = await self.app.extract([url], schema=schema)

                        extracted = {}
                        if isinstance(scrape_res, dict):
                            extracted = scrape_res.get("data", {})
                        else:
                            extracted = getattr(scrape_res, "data", {})

                        img_url = (
                            extracted.get("main_image_url")
                            if isinstance(extracted, dict)
                            else getattr(extracted, "main_image_url", None)
                        )
                        if img_url:
                            return img_url

            return None
        except Exception as e:
            print(f"Get Product Image Error: {e}")
            return None

    async def compare_prices(self, product_name: str) -> list[dict[str, Any]]:
        """
        Search for a product on Amazon and Flipkart, then extract live data
        for comparison.
        """
        try:
            # 1. Search for Amazon and Flipkart URLs
            search_query = f"{product_name} price Amazon Flipkart India"
            search_results = await self.app.search(search_query)
            print(f"DEBUG Raw Search Results: {search_results}")

            # 2. Filter for relevant URLs
            urls_to_scrape = []
            seen_domains = set()

            # search_results is a Pydantic model in v2, metadata is in .web
            web_results = []
            if hasattr(search_results, "web"):
                web_results = search_results.web
            elif isinstance(search_results, dict):
                web_results = search_results.get("web", []) or search_results.get(
                    "data", []
                )

            print(f"DEBUG Web Results: {web_results}")

            for result in web_results:
                url = (
                    getattr(result, "url", "")
                    if not isinstance(result, dict)
                    else result.get("url", "")
                )
                print(f"DEBUG Checking URL: {url}")
                if not url:
                    continue

                domain = ""
                # More robust domain check
                lower_url = url.lower()
                if "amazon.in" in lower_url or "amazon.com" in lower_url:
                    domain = "amazon"
                elif "flipkart.com" in lower_url:
                    domain = "flipkart"

                if domain and domain not in seen_domains:
                    urls_to_scrape.append({"url": url, "platform": domain})
                    seen_domains.add(domain)

                if len(urls_to_scrape) >= 2:
                    break

            print(f"DEBUG URLs to Scrape: {urls_to_scrape}")

            # 3. Extract data for each URL
            comparison_results = []
            for item in urls_to_scrape:
                print(f"Scraping {item['platform']}: {item['url']}...")
                data = await self.get_live_data(item["url"])

                # data is also a Pydantic model/dict depending on version
                # In v2 extract returns a dict or Document object
                success = False
                extracted = {}

                if isinstance(data, dict):
                    success = data.get("success", False)
                    extracted = data.get("data", {})
                else:
                    success = getattr(data, "success", False)
                    extracted = getattr(data, "data", {})

                if success:
                    comparison_results.append(
                        {
                            "platform": item["platform"],
                            "url": item["url"],
                            "price": extracted.get("price")
                            if isinstance(extracted, dict)
                            else getattr(extracted, "price", None),
                            "stock_status": extracted.get("stock_status")
                            if isinstance(extracted, dict)
                            else getattr(extracted, "stock_status", None),
                            "reviews": extracted.get("latest_reviews")
                            if isinstance(extracted, dict)
                            else getattr(extracted, "latest_reviews", []),
                        }
                    )

            return comparison_results
        except Exception as e:
            print(f"Comparison Error: {e}")
            return [{"error": str(e)}]


enrichment_service = EnrichmentService()
