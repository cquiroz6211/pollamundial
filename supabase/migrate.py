import requests
import json

SUPABASE_URL = "https://jlfxpcjfmirhbtpxmeof.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZnhwY2pmbWlyaGJ0cHhtZW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA5NjQ5MiwiZXhwIjoyMDk2NjcyNDkyfQ._iMkJ-ado84TQFGPN_E3ZJrKaqGGyW7yGr0gM0ui5ZY"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Create groups table
requests.post(f"{SUPABASE_URL}/rest/v1/", headers={**headers, "table": "groups;enableapiaccess=false"}, data="{}")

# Actually, we need to use the SQL endpoint
# Supabase has a postgrest endpoint, but for SQL we need to use the management API

# Let's try a different approach - create tables using PostgREST with explicit SQL
# Since PostgREST doesn't support raw SQL, we'll use the Supabase management API

# Alternative: Use psql if available, or create tables one by one via REST

# For now, let's just verify the connection works
response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers={
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Accept-Profile": "api",
})

print(f"Connection test: {response.status_code}")
print(response.text)
