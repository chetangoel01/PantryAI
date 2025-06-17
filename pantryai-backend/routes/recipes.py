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
def search_recipes():
    query = request.args.get('query', '')
    ingredients = request.args.get('ingredients', '')
    
    if not query and not ingredients:
        return jsonify(error="Please provide either a search query or ingredients"), 400

    logger.info(f"Searching recipes with query: {query} or ingredients: {ingredients}")

    try:
        if query:
            # Text-based search using ilike for case-insensitive partial matching
            search_query = f"%{query}%"
            res = (
                supabase
                .table('recipes')
                .select('*')
                .or_(f"name.ilike.{search_query},description.ilike.{search_query}")
                .limit(20)
                .execute()
            )
            logger.info(f"Found {len(res.data)} recipes matching query: {query}")
        else:
            # Ingredient-based search
            ingredients_list = [i.strip().lower() for i in ingredients.split(',') if i.strip()]
            payload = json.dumps(ingredients_list)
            res = (
                supabase
                .table('recipes')
                .select('*')
                .filter('cleaned_ingredients_list', 'cs', payload)
                .limit(20)
                .execute()
            )
            logger.info(f"Found {len(res.data)} recipes matching ingredients: {ingredients_list}")

        return jsonify(results=res.data), 200

    except Exception as e:
        logger.exception(f"Error searching recipes: {str(e)}")
        return jsonify(error=str(e)), 500


@recipes_bp.route('/recipes/filter', methods=['GET'])
def filter_recipes():
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'asc')
    dietary = request.args.get('dietary', '')
    cuisine = request.args.get('cuisine', '')
    difficulty = request.args.get('difficulty', '')
    
    logger.info(f"Filtering recipes with params: sort_by={sort_by}, sort_order={sort_order}, dietary={dietary}, cuisine={cuisine}, difficulty={difficulty}")
    
    try:
        query = supabase.table('recipes').select('*')
        
        # Apply filters
        if dietary:
            query = query.eq('dietary_restrictions', dietary.lower())
        if cuisine:
            query = query.eq('cuisine', cuisine.lower())
        if difficulty:
            query = query.eq('difficulty', difficulty.lower())
            
        # Apply sorting
        if sort_by == 'name':
            query = query.order('name', desc=(sort_order == 'desc'))
        elif sort_by == 'rating':
            query = query.order('ratings', desc=(sort_order == 'desc'))
        elif sort_by == 'time':
            query = query.order('times->cook', desc=(sort_order == 'desc'))
        elif sort_by == 'calories':
            query = query.order('nutrients->calories', desc=(sort_order == 'desc'))
            
        # Execute query
        logger.info("Executing Supabase query...")
        res = query.limit(50).execute()
        logger.info(f"Query returned {len(res.data)} results")
        
        return jsonify(results=res.data), 200
        
    except Exception as e:
        logger.exception(f"Error filtering recipes: {str(e)}")
        return jsonify(error=str(e)), 500


@recipes_bp.route('/recipes/<recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    logger.info(f"Fetching recipe with ID: {recipe_id}")
    
    try:
        res = (
            supabase
            .table('recipes')
            .select('*')
            .eq('id', recipe_id)
            .single()
            .execute()
        )
        
        if not res.data:
            logger.warning(f"Recipe not found with ID: {recipe_id}")
            return jsonify(error="Recipe not found"), 404
            
        logger.info(f"Found recipe: {res.data['name']}")
        return jsonify(recipe=res.data), 200
        
    except Exception as e:
        logger.exception(f"Error fetching recipe: {str(e)}")
        return jsonify(error=str(e)), 500
