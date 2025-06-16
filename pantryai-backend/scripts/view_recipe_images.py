import sys, os

# Ensure project root is on Python path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import streamlit as st
from db import supabase

# ——— Streamlit UI ———
st.set_page_config(page_title="Recipe Images Viewer", layout="wide")
st.title("🍳 Recipe Images Gallery")

# Fetch all recipes with images
resp = supabase.table("recipes").select("id,name,image_url").not_.is_("image_url", "null").execute()
recipes = resp.data or []

if not recipes:
    st.warning("No recipes with images found!")
    st.stop()

# Display recipes in a grid
cols = st.columns(3)  # 3 columns for the grid
for idx, recipe in enumerate(recipes):
    col = cols[idx % 3]
    with col:
        st.subheader(recipe['name'])
        if recipe.get('image_url'):
            st.image(recipe['image_url'], use_column_width=True)
        else:
            st.warning("No image available") 