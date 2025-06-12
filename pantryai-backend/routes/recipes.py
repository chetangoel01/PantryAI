from flask import Blueprint, request, jsonify
from recipes import match_recipes
from utils.logger import logger
from db import supabase  # To fetch pantry items
from utils.embeddings import generate_text_embedding, parse_ingredient_name
import json

recipes_bp = Blueprint('recipes', __name__)

def get_pantry_items_text_for_embedding() -> str:
    """
    Fetches current pantry items from Supabase, cleans their names, and concatenates them
    into a single string suitable for embedding.
    """
    try:
        res = supabase.table('pantry').select('name', 'quantity', 'unit').execute()
        pantry_items_data = res.data or []

        item_strings = []
        for item in pantry_items_data:
            name = item.get('name', '').strip()
            cleaned_name = parse_ingredient_name(name)
            if not cleaned_name:
                continue

            parts = []
            qty = item.get('quantity')
            unit = item.get('unit', '').strip()
            if qty is not None and qty > 0:
                parts.append(str(qty))
            if unit:
                parts.append(unit)
            parts.append(cleaned_name)
            item_strings.append(" ".join(parts))

        return ", ".join(item_strings)

    except Exception as e:
        logger.error(f"Error fetching pantry items for embedding: {e}", exc_info=True)
        return ""


@recipes_bp.route('/recipes/match', methods=['GET'])
def match_recipes_from_pantry():
    try:
        pantry_text = get_pantry_items_text_for_embedding()
        if not pantry_text:
            return jsonify(message="Your pantry is empty. Please add items to get recipe suggestions."), 200

        pantry_embedding = generate_text_embedding(pantry_text)
        if not pantry_embedding:
            return jsonify(error="Failed to generate embedding for your pantry items. Please try again."), 500

        k_param = request.args.get('k', 5)
        try:
            k_param = int(k_param)
        except ValueError:
            k_param = 5

        results = match_recipes(pantry_embedding, k=k_param)
        return jsonify(results), 200

    except Exception as e:
        logger.error("Error in /recipes/match endpoint", exc_info=e)
        return jsonify(error=str(e)), 500


@recipes_bp.route('/recipes/search', methods=['GET'])
def search_by_ingredients():
    raw = request.args.get('ingredients', '')
    ingredients = [i.strip().lower() for i in raw.split(',') if i.strip()]
    
    if not ingredients:
        return jsonify(error="Please provide at least one ingredient"), 400

    logger.info(f"Searching for recipes with ingredients: {ingredients}")

    try:
        # JSON-encode the ingredient list (e.g., '["mushroom", "onion"]')
        payload = json.dumps(ingredients)

        # Use the 'cs' (contains) filter with a JSON payload
        res = (
            supabase
              .table('recipes')
              .select('*')
              .filter('cleaned_ingredients_list', 'cs', payload)
              .execute()
        )

        return jsonify(results=res.data), 200

    except Exception:
        logger.exception("Error searching recipes by ingredients")
        return jsonify(error="Internal server error"), 500
