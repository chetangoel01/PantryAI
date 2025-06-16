import sys, os

# Ensure project root is on Python path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import streamlit as st
import time
import requests
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from db import supabase
from config import Config

# ——— Pexels API setup ———
PEXELS_BASE = "https://api.pexels.com/v1"
PEXELS_HEADERS = {"Authorization": AUTH_TOKEN}

# ——— Helpers ———
def scrape_image_url(page_url: str) -> str:
    """
    Try Open-Graph or first <img> from the recipe page.
    """
    try:
        resp = requests.get(page_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]
        article = soup.find("article") or soup
        img = article.find("img")
        if img and img.get("src"):
            return img["src"]
    except Exception:
        return ""
    return ""

async def fetch_pexels_fallback(session: aiohttp.ClientSession, query: str) -> str:
    """
    Get first Pexels result for the given query.
    """
    params = {"query": query, "per_page": 1}
    try:
        async with session.get(f"{PEXELS_BASE}/search", params=params, headers=PEXELS_HEADERS) as r:
            if r.status == 200:
                data = await r.json()
                photos = data.get("photos", [])
                if photos:
                    return photos[0]["src"]["medium"]
    except Exception:
        return ""
    return ""

# ——— Streamlit UI ———
st.set_page_config(page_title="Recipe Image Auto-Populate", layout="wide")

# Load recipes on first run
if "recipes" not in st.session_state:
    resp = supabase.table("recipes").select("id,name,url").is_("image_url", "null").execute()
    st.session_state.recipes = resp.data or []
    st.session_state.idx = 0

recipes = st.session_state.recipes
idx = st.session_state.idx

st.title("🔄 Auto-Populate Recipe Images")

# If done, stop
if idx >= len(recipes):
    st.success("✅ All recipes processed")
    st.stop()

recipe = recipes[idx]
st.subheader(f"Processing {idx+1}/{len(recipes)}: {recipe['name']}")

# Display current recipe info and try to show its image
st.markdown("---")
st.write(f"**Current recipe:** {recipe['name']}")
if recipe.get('url'):
    st.write(f"**URL:** {recipe['url']}")
    # Try to show the image from the URL
    try:
        img_url = scrape_image_url(recipe['url'])
        if img_url:
            st.write("**Found image from URL:**")
            st.image(img_url, width=300)
    except Exception as e:
        st.write("Could not load image from URL")

# Only run processing once per index
if st.session_state.get("last_idx") != idx:
    img_url = scrape_image_url(recipe.get("url", ""))
    method = "Scraped"

    # Fallback to Pexels if scraping fails
    if not img_url:
        method = "Pexels"
        async def get_fallback():
            async with aiohttp.ClientSession() as sess:
                return await fetch_pexels_fallback(sess, f"{recipe['name']} recipe food")
        img_url = asyncio.run(get_fallback())

    # If still no image, warn and skip
    if not img_url:
        st.warning(f"No image found for '{recipe['name']}', skipping.")
    else:
        # Update in Supabase with try/except
        try:
            supabase.table("recipes").update({"image_url": img_url}).eq("id", recipe["id"]).execute()
            st.success(f"{method} image applied: {img_url}")
            st.session_state.last_name = recipe["name"]
            st.session_state.last_method = method
            st.session_state.last_img = img_url
        except Exception as e:
            st.error(f"DB update failed: {e}")

    # Mark as processed and advance
    st.session_state.last_idx = idx
    st.session_state.idx += 1
    time.sleep(1)
    st.rerun()

# Display last processed info
if st.session_state.get("last_name"):
    st.markdown("---")
    st.write(f"**Last processed:** {st.session_state.last_name} ({st.session_state.last_method})")
    if st.session_state.get("last_img"):
        st.image(st.session_state.last_img, width=300)

# Preview next recipe
if idx + 1 < len(recipes):
    st.markdown("---")
    st.write(f"Next up: **{recipes[idx + 1]['name']}**")
