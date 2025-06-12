from flask import Blueprint, request, jsonify
from recipes import match_recipes
from utils.logger import logger
from db import supabase # To fetch pantry items
from utils.embeddings import generate_text_embedding, parse_ingredient_name # Import parse_ingredient_name for pantry
import json

recipes_bp = Blueprint('recipes', __name__)

def get_pantry_items_text_for_embedding() -> str:
    """
    Fetches current pantry items from Supabase, cleans their names, and concatenates them
    into a single string suitable for embedding.
    """
    try:
        # Fetch only relevant fields to minimize data transfer
        res = supabase.table('pantry').select('name', 'quantity', 'unit').execute()
        pantry_items_data = res.data

        if not pantry_items_data:
            return ""

        item_strings = []
        for item in pantry_items_data:
            name = item.get('name', '').strip()
            # Apply the same cleaning logic to pantry item names for consistency
            cleaned_name = parse_ingredient_name(name)

            if cleaned_name: # Only include items with a cleaned name
                # Format item string as "quantity unit name" (e.g., "2 lbs Apples")
                # Handle cases where unit or quantity might be missing
                part_string = ""
                quantity = item.get('quantity')
                unit = item.get('unit', '').strip()

                if quantity is not None and quantity > 0:
                    part_string += f"{quantity} "
                if unit:
                    part_string += f"{unit} "
                part_string += cleaned_name # Use the cleaned name here
                item_strings.append(part_string)

        # Combine all item strings into one comprehensive string for embedding
        return ", ".join(item_strings)
    except Exception as e:
        logger.error(f"Error fetching pantry items for embedding: {e}", exc_info=True)
        return ""


@recipes_bp.route('/recipes/match', methods=['GET'])
def match_recipes_from_pantry():
    """
    Generates a pantry vector from current user's pantry items and matches recipes.
    """
    try:
        # 1. Get current pantry items and create a representative text string
        pantry_text = get_pantry_items_text_for_embedding()
        if not pantry_text:
            return jsonify(message="Your pantry is empty. Please add items to get recipe suggestions."), 200

        # 2. Generate an embedding for the pantry text
        pantry_embedding = generate_text_embedding(pantry_text)
        if not pantry_embedding:
            return jsonify(error="Failed to generate embedding for your pantry items. Please try again."), 500

        # 3. Use the pantry embedding to match recipes
        # You can add a 'k' parameter to the request to control the number of results
        k_param = request.args.get('k', 5)
        try:
            k_param = int(k_param)
        except ValueError:
            k_param = 5 # Default if k is invalid

        results = match_recipes(pantry_embedding, k=k_param)
        return jsonify(results), 200

    except Exception as e:
        logger.error("Error in /recipes/match endpoint", exc_info=e)
        return jsonify(error=str(e)), 500

@recipes_bp.route('/recipes/search', methods=['GET'])
def search_by_ingredients():
    """
    Search recipes whose cleaned_ingredients_list array contains *all* of the provided items.
    Query-param `ingredients` should be a comma-separated list, e.g. ?ingredients=apple,flour
    """
    raw_ingredients_param = request.args.get('ingredients', '')
    
    # Process the comma-separated string into a list of cleaned, lowercased ingredients
    ingredients_list_for_query = [
        item.strip().lower() for item in raw_ingredients_param.split(',') if item.strip()
    ]

    if not ingredients_list_for_query:
        return jsonify(error="Please provide at least one ingredient via ?ingredients=apple,flour"), 400
    
    try:
        logger.info(f"Searching for recipes containing all of: {ingredients_list_for_query} in cleaned_ingredients_list")
        res = (
            supabase
            .table('recipes')
            .select('*')
            # *** Ensure this uses cleaned_ingredients_list ***
            .contains('cleaned_ingredients_list', ingredients_list_for_query)
            .execute()
        )
        return jsonify(results=res.data), 200
    except Exception as e:
        logger.error("Error searching recipes by ingredients", exc_info=e)
        return jsonify(error=str(e)), 500