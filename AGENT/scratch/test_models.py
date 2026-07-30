import os
from dotenv import load_dotenv
load_dotenv()

print("--- Listing Gemini Models ---")
try:
    from google import genai
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    for m in client.models.list():
        print(f"Gemini Model: {m.name}")
except Exception as e:
    print(f"Failed to list Gemini models: {e}")

print("\n--- Listing Groq Models ---")
try:
    from groq import Groq
    groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    models = groq_client.models.list()
    for m in models.data:
        print(f"Groq Model: {m.id}")
except Exception as e:
    print(f"Failed to list Groq models: {e}")
