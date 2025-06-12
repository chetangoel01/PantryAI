import json
import faiss
import numpy as np
# Make sure parse_ingredient_name is imported from utils.embeddings
from utils.embeddings import generate_text_embedding, create_recipe_text_for_embedding, parse_ingredient_name
from db import supabase
from utils.logger import logger
import os
import re

# Ensure this script is run from the pantryai-backend directory
# or adjust paths accordingly if running from a different location.
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), 'recipes.index')
FAISS_ID_MAP_PATH = os.path.join(os.path.dirname(__file__), 'recipes_id_map.json')


def clean_ingredients(ingredients_list):
    """
    Cleans a list of ingredients for better embedding generation.
    This can be a simpler cleaning than parse_ingredient_name if you just want to remove symbols.
    For more robust cleaning of the actual *names* for the embedding text,
    you might apply parse_ingredient_name to each item and then join.
    But for simple text cleanup for embedding, this is usually sufficient.
    """
    cleaned = []
    for ingredient in ingredients_list:
        if isinstance(ingredient, str):
            cleaned_ingredient = ingredient.strip().lower()
            cleaned_ingredient = re.sub(r'\s+', ' ', cleaned_ingredient)
            cleaned_ingredient = re.sub(r'[^a-z0-9\s]', '', cleaned_ingredient) # Remove non-alphanumeric except spaces
            if cleaned_ingredient:
                cleaned.append(cleaned_ingredient)
    return cleaned

def ingest_recipes_and_build_index():
    logger.info("Starting recipe ingestion and FAISS index building...")

    # 1. Load all recipe JSON files
    all_recipes = []
    json_files = ["recipes.json", "inspiration.json", "baking.json", "health.json", "budget.json"]
    for filename in json_files:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning(f"File not found: {filepath}. Skipping.")
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict) and "recipes" in data:
                all_recipes.extend(data["recipes"])
            else:
                all_recipes.extend(data)
    logger.info(f"Loaded {len(all_recipes)} recipes from JSON files.")

    if not all_recipes:
        logger.error("No recipes loaded. Exiting ingestion.")
        return

    # Prepare containers
    embeddings = []
    faiss_idx_to_recipe_id_map = []
    recipes_for_db = []

    # Filter out any recipes missing id or name
    valid_recipes = [r for r in all_recipes if r.get('id') and r.get('name')]
    logger.info(f"Processing {len(valid_recipes)} valid recipes for embedding and database insertion.")

    for i, recipe in enumerate(valid_recipes):
        recipe_id = recipe['id']
        original_ingredients_list = recipe.get('ingredients', [])

        # --- Build cleaned_ingredients_list with phrase- and token-level keys, preserving order ---
        seen = {}  # ordered dict by insertion order
        for raw in original_ingredients_list:
            if not isinstance(raw, str):
                logger.warning(f"Ingredient item in recipe {recipe_id} is not a string: {raw}")
                continue

            cleaned = parse_ingredient_name(raw)
            if not cleaned:
                continue

            # Keep the full cleaned phrase
            seen[cleaned] = None
            # Also split into individual tokens
            for tok in cleaned.split():
                seen[tok] = None

        # Assign back as list in original-discovered order (deduped)
        recipe['cleaned_ingredients_list'] = list(seen)
        # --- End cleaned_ingredients_list population ---

        # Clean for embedding text (may differ from list used for search)
        recipe['cleaned_ingredients'] = clean_ingredients(original_ingredients_list)

        # Generate embedding
        text_for_embedding = create_recipe_text_for_embedding(recipe)
        embedding = generate_text_embedding(text_for_embedding)

        # Only include valid embeddings
        if embedding and len(embedding) == 768:
            embeddings.append(embedding)
            faiss_idx_to_recipe_id_map.append(recipe_id)

            # Prepare DB record
            db_entry = {
                "id": recipe_id,
                "url": recipe.get('url'),
                "name": recipe.get('name'),
                "author": recipe.get('author'),
                "ratings": recipe.get('rattings'),
                "description": recipe.get('description'),
                "ingredients": recipe.get('ingredients'),
                "steps": recipe.get('steps'),
                "nutrients": recipe.get('nutrients'),
                "times": recipe.get('times'),
                "serves": recipe.get('serves'),
                "difficulty": recipe.get('difficult'),
                "vote_count": recipe.get('vote_count'),
                "subcategory": recipe.get('subcategory'),
                "dish_type": recipe.get('dish_type'),
                "maincategory": recipe.get('maincategory'),
                # include our new column
                "cleaned_ingredients_list": recipe.get('cleaned_ingredients_list')
            }
            recipes_for_db.append(db_entry)
        else:
            logger.warning(f"Skipping recipe ID '{recipe_id}' due to invalid or missing embedding.")

        if (i + 1) % 5 == 0:
            logger.info(f"Processed {i + 1}/{len(valid_recipes)} recipes...")

    # Ensure we have embeddings before proceeding
    if not embeddings:
        logger.error("No valid embeddings generated. Cannot build FAISS index or insert into Supabase.")
        return

    # 2. Build FAISS index
    embeddings_np = np.array(embeddings, dtype="float32")
    dimension = embeddings_np.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_np)
    faiss.write_index(index, FAISS_INDEX_PATH)
    logger.info(f"FAISS index built and saved to {FAISS_INDEX_PATH} with {index.ntotal} vectors.")

    # Save ID map
    with open(FAISS_ID_MAP_PATH, 'w') as f:
        json.dump(faiss_idx_to_recipe_id_map, f)
    logger.info(f"FAISS ID map saved to {FAISS_ID_MAP_PATH}.")

    # 3. Upsert into Supabase
    logger.info(f"Attempting to insert {len(recipes_for_db)} recipes into Supabase 'recipes' table.")
    batch_size = 500
    for start in range(0, len(recipes_for_db), batch_size):
        batch = recipes_for_db[start:start + batch_size]
        try:
            res = supabase.table('recipes').upsert(batch, on_conflict='id').execute()
            if res.data:
                logger.info(f"Successfully inserted/updated {len(res.data)} recipes (batch {start//batch_size + 1}).")
            elif res.error:
                logger.error(f"Supabase insertion/update error for batch {start//batch_size + 1}: {res.error}")
        except Exception as e:
            logger.error(f"General error during Supabase batch insertion/update {start//batch_size + 1}: {e}", exc_info=True)

    logger.info("Recipe ingestion and FAISS index building complete.")


if __name__ == "__main__":
    # BEFORE RUNNING THIS:
    # 1. Ensure your .env file in pantryai-backend has SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY.
    # 2. Create a 'data' directory inside your pantryai-backend folder and place your JSON recipe files there.
    # 3. ***MANUALLY*** run the following SQL command in your Supabase SQL Editor ONCE
    #    to add the 'cleaned_ingredients_list' column to your 'recipes' table:
    #    ALTER TABLE recipes ADD COLUMN cleaned_ingredients_list jsonb;
    ingest_recipes_and_build_index()