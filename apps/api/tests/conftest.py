import os

# Set dummy environment variables for tests before importing the app
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "dummy_anon_key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "dummy_service_role_key"
os.environ["GEMINI_API_KEY"] = "dummy_gemini_key"
