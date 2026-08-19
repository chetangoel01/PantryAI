# File: config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    # If FAISS_INDEX_PATH isn’t set (or is an empty string), default to recipes.index
    FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH") or "recipes.index"
