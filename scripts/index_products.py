import asyncio
import csv
import json
import os
import re
from typing import Any, Dict, List, Optional

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
    if not price_str: return 0.0
    # Remove currency symbols and commas
    cleaned = re.sub(r'[^\d.]', '', price_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def clean_int(val_str: str) -> int:
    """Convert string with commas to int."""
    if not val_str: return 0
    cleaned = re.sub(r'[^\d]', '', val_str)
    try:
        return int(cleaned)
    except ValueError:
        return 0

def clean_rating(rating_str: str) -> float:
    """Convert rating string to float."""
    if not rating_str or rating_str == '|': return 0.0
    try:
        return float(rating_str)
    except ValueError:
        return 0.0

async def get_embedding(text: str) -> List[float]:
    """Generate 768-dim embedding using Gemini gemini-embedding-001."""
    # Truncate text to avoid model limits
    safe_text = text[:3000]
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
        print(f"Embedding error: {e}")
        return [0.0] * 768

async def load_products_from_csv(file_path: str, limit: int = 1000) -> List[Dict[str, Any]]:
    """Load and clean products from the Amazon CSV dataset."""
    products = []
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return []

    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= limit: break
            
            # Map CSV columns to our schema
            product = {
                "title": row.get("product_name", ""),
                "description": row.get("about_product", ""),
                "price": clean_price(row.get("discounted_price", "0")),
                "category": row.get("category", "").split("|")[0] if row.get("category") else "General",
                "rating": clean_rating(row.get("rating", "0")),
                "review_count": clean_int(row.get("rating_count", "0")),
                "image_url": row.get("img_link", ""),
                "specs": {
                    "product_id": row.get("product_id"),
                    "discount_percentage": row.get("discount_percentage"),
                    "actual_price": row.get("actual_price")
                }
            }
            products.append(product)
    
    print(f"Loaded {len(products)} products from CSV.")
    return products

async def index_products(products: List[Dict[str, Any]]):
    """Index product list into Supabase with embeddings."""
    # Clear existing products
    try:
        supabase.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleared existing products.")
    except Exception as e:
        print(f"Error clearing products: {e}")

    batch_size = 10
    for i in range(0, len(products), batch_size):
        batch = products[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(products)-1)//batch_size + 1}...")
        
        batch_data = []
        for product in batch:
            # Combine title and description for semantic search context
            content_to_embed = f"{product['title']}\n{product['description']}\n{product['category']}"
            embedding = await get_embedding(content_to_embed)
            
            data = {
                "title": product["title"],
                "description": product["description"],
                "price": product["price"],
                "category": product["category"],
                "specs": product["specs"],
                "rating": product["rating"],
                "review_count": product["review_count"],
                "image_url": product["image_url"],
                "embedding": embedding
            }
            batch_data.append(data)
        
        try:
            supabase.table("products").insert(batch_data).execute()
            print(f"Successfully indexed batch of {len(batch)} products.")
        except Exception as e:
            print(f"Error indexing batch: {e}")

if __name__ == "__main__":
    CSV_FILE = "amazon_products.csv"
    async def run():
        # Using 500 products for a robust and high-quality searchable inventory
        products = await load_products_from_csv(CSV_FILE, limit=500)
        await index_products(products)
    
    asyncio.run(run())
