import asyncio
import csv
import os
import re
from typing import Any, Dict, List

from google import genai
from google.genai import types
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, "../apps/api/.env")
load_dotenv(dotenv_path=env_path)

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials")
supabase = create_client(supabase_url, supabase_key)

# Initialize Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
if not gemini_key:
    raise ValueError("Missing Gemini API key")
client = genai.Client(api_key=gemini_key)


def clean_price(price_str: str) -> float:
    """Convert currency string (e.g., ₹1,099) to float."""
    if not price_str:
        return 0.0
    # Remove currency symbols and commas
    cleaned = re.sub(r"[^\d.]", "", price_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def clean_int(val_str: str) -> int:
    """Convert string with commas to int."""
    if not val_str:
        return 0
    cleaned = re.sub(r"[^\d]", "", val_str)
    try:
        return int(cleaned)
    except ValueError:
        return 0


def clean_rating(rating_str: str) -> float:
    """Convert rating string to float."""
    if not rating_str or rating_str == "|":
        return 0.0
    try:
        return float(rating_str)
    except ValueError:
        return 0.0

async def get_embedding(text: str) -> List[float]:
    """Generate 768-dim embedding using Gemini gemini-embedding-001 with retry logic."""
    safe_text = text[:3000]
    max_retries = 5
    base_delay = 2
    for attempt in range(max_retries):
        try:
            result = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=safe_text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=768
                )
            )
            return result.embeddings[0].values
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"Rate limit hit. Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(delay)
            else:
                print(f"Embedding error: {e}")
                return [] # Return empty to indicate failure
    return []


async def load_products_from_csv(
    file_path: str, limit: int = 250
) -> List[Dict[str, Any]]:
    """Load and clean products from the Amazon CSV dataset, ensuring diversity."""
    products = []
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return []

    # Target counts to ensure diversity
    targets = {
        "mouse": 20,
        "keyboard": 20,
        "headphone": 20,
        "earphone": 20,
        "tv": 40,
        "monitor": 10,
        "cable": 20,
        "laptop": 20,
        "smartwatch": 20
    }
    counts = {k: 0 for k in targets.keys()}
    general_count = 0
    general_target = limit - sum(targets.values())

    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if len(products) >= limit:
                break

            title = row.get("product_name", "").lower()
            category_match = None
            
            for k in targets.keys():
                if k in title and "cable" not in title if k != "cable" else True:
                    if counts[k] < targets[k]:
                        counts[k] += 1
                        category_match = k
                        break
            
            if not category_match:
                if general_count < general_target:
                    general_count += 1
                else:
                    continue # Skip if we don't need more of this general type

            # Map CSV columns to our schema
            product = {
                "title": row.get("product_name", ""),
                "description": row.get("about_product", ""),
                "price": clean_price(row.get("discounted_price", "0")),
                "category": row.get("category", "").replace("|", " ") if row.get("category") else "General",
                "rating": clean_rating(row.get("rating", "0")),
                "review_count": clean_int(row.get("rating_count", "0")),
                "image_url": row.get("img_link", ""),
                "specs": {
                    "product_id": row.get("product_id"),
                    "discount_percentage": row.get("discount_percentage"),
                    "actual_price": row.get("actual_price"),
                },
            }
            products.append(product)

    print(f"Loaded {len(products)} diverse products from CSV.")
    return products


async def index_products(products: List[Dict[str, Any]]):
    """Index product list into Supabase with embeddings."""
    # Clear existing products
    try:
        supabase.table("products").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        print("Cleared existing products.")
    except Exception as e:
        print(f"Error clearing products: {e}")

    batch_size = 5 # Gentler batch size
    for i in range(0, len(products), batch_size):
        batch = products[i : i + batch_size]
        print(
            f"Processing batch {i // batch_size + 1}/{(len(products) - 1) // batch_size + 1}..."
        )

        batch_data = []
        for product in batch:
            content_to_embed = (
                f"{product['title']}\n{product['description']}\n{product['category']}"
            )
            embedding = await get_embedding(content_to_embed)

            if embedding and len(embedding) == 768:
                data = {
                    "title": product["title"],
                    "description": product["description"],
                    "price": product["price"],
                    "category": product["category"],
                    "specs": product["specs"],
                    "rating": product["rating"],
                    "review_count": product["review_count"],
                    "image_url": product["image_url"],
                    "embedding": embedding,
                }
                batch_data.append(data)
            else:
                print(f"Skipping product due to missing/invalid embedding: {product['title'][:50]}...")

        if batch_data:
            try:
                supabase.table("products").insert(batch_data).execute()
                print(f"Successfully indexed batch of {len(batch_data)} products.")
            except Exception as e:
                print(f"Error indexing batch: {e}")
        
        # Throttling
        await asyncio.sleep(0.5)


if __name__ == "__main__":
    CSV_FILE = "amazon_products.csv"

    async def run():
        # Indexing 250 products to ensure we have a valid test set without hitting massive rate limits
        products = await load_products_from_csv(CSV_FILE, limit=250)
        await index_products(products)

    asyncio.run(run())
