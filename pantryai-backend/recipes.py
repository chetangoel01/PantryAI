import faiss
import numpy as np
from config import Config
from utils.logger import logger
from db import supabase
import json
from utils.embeddings import generate_text_embedding # Also used to embed incoming pantry_vector

# Initialize FAISS index and recipe ID map globally
index = None
recipe_id_map = []

# Load the FAISS index and ID map when the module is imported
try:
    index = faiss.read_index(Config.FAISS_INDEX_PATH)
    id_map_path = Config.FAISS_INDEX_PATH.replace('.index', '_id_map.json')
    with open(id_map_path, 'r') as f:
        recipe_id_map = json.load(f)
    logger.info(f"FAISS index loaded from {Config.FAISS_INDEX_PATH} with {index.ntotal} vectors.")
    logger.info(f"Recipe ID map loaded from {id_map_path}.")
except Exception as e:
    logger.error(f"Error loading FAISS index or ID map: {e}", exc_info=True)
    index = faiss.IndexFlatL2(768) # Fallback to an empty index if loading fails
    logger.warning("Initialized empty FAISS index due to load failure.")

def match_recipes(pantry_vector: list[float], k: int = 5) -> dict:
    """
    Matches recipes based on the provided pantry vector using FAISS and fetches full recipe details from Supabase.
    """
    if not index or index.ntotal == 0:
        logger.warning("FAISS index is not loaded or is empty. Cannot match recipes.")
        return {"matched_recipes": []}

    vec = np.array(pantry_vector, dtype="float32").reshape(1, -1)

    # Validate input vector dimension against FAISS index dimension
    if vec.shape[1] != index.d:
        logger.error(f"Input vector dimension {vec.shape[1]} does not match FAISS index dimension {index.d}.")
        return {"matched_recipes": []}

    try:
        # Perform the FAISS search
        D, I = index.search(vec, min(k, index.ntotal)) # D: distances, I: internal FAISS indices

        matched_results_minimal = []
        for rank, faiss_internal_idx in enumerate(I[0]):
            score = float(D[0][rank]) # The distance score
            # Ensure the internal index is within the bounds of our recipe_id_map
            if 0 <= faiss_internal_idx < len(recipe_id_map):
                recipe_string_id = recipe_id_map[faiss_internal_idx]
                matched_results_minimal.append({
                    "recipe_id": recipe_string_id,
                    "score": score
                })
            else:
                logger.warning(f"FAISS returned an out-of-bounds internal index: {faiss_internal_idx}. Skipping.")

        # If no matches or invalid indices, return early
        if not matched_results_minimal:
            logger.info("No valid recipe matches found by FAISS.")
            return {"matched_recipes": []}

        # Fetch full recipe details from Supabase for the matched IDs
        recipe_ids_to_fetch = [res['recipe_id'] for res in matched_results_minimal]
        res = supabase.table('recipes').select('*').in_('id', recipe_ids_to_fetch).execute()

        if res.data:
            # Create a dictionary for quick lookup of fetched recipes by their ID
            fetched_recipes_by_id = {recipe['id']: recipe for recipe in res.data}
            final_recipes_with_scores = []
            for match in matched_results_minimal:
                full_recipe = fetched_recipes_by_id.get(match['recipe_id'])
                if full_recipe:
                    # Combine the score with the full recipe data
                    full_recipe['score'] = match['score']
                    final_recipes_with_scores.append(full_recipe)
            logger.info(f"Successfully fetched {len(final_recipes_with_scores)} full recipe details from Supabase.")
            return {"matched_recipes": final_recipes_with_scores}
        else:
            logger.warning("No recipe details found in Supabase for the matched IDs. This might indicate a data inconsistency.")
            return {"matched_recipes": []}

    except Exception as e:
        logger.error(f"Error during FAISS search or Supabase data retrieval: {e}", exc_info=True)
        return {"matched_recipes": []}