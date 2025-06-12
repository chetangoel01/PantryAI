import google.generativeai as genai
from config import Config
from utils.logger import logger
import re  # For regex ops

# Precompile regex patterns
PAREN_REGEX = re.compile(r"[\(\[].*?[\)\]]")    # Remove text in parentheses/brackets
NON_ALNUM_REGEX = re.compile(r"[^a-z0-9-]+")      # Remove non-alphanumeric except hyphens

# Define filter words at module level for quick lookups
FILTER_WORDS = {
    'tsp', 'teaspoon', 'tbsp', 'tablespoon', 'g', 'gram', 'kg', 'kilogram',
    'ml', 'milliliter', 'l', 'liter', 'oz', 'ounce', 'lb', 'pound',
    'cup', 'clove', 'pinch', 'dash', 'small', 'medium', 'large',
    # common descriptors
    'chopped', 'minced', 'diced', 'sliced', 'ground',
    'fresh', 'dried', 'raw', 'cooked', 'cubed',
    # numbers
    'one','two','three','four','five','six','seven','eight','nine','ten',
    # general words
    'and','or','a','an','the','to','for','with','plus','some','any',
}

# Specific corrections mapping
CORRECTIONS = {
    'all-purpose flour': 'flour',
    'granulated sugar': 'sugar',
    'bell pepper': 'bell pepper',
    'olive oil': 'olive oil',
    'soy sauce': 'soy sauce',
    # add more as needed
}

# Configure embedding
genai.configure(api_key=Config.GOOGLE_API_KEY)

def generate_text_embedding(text: str) -> list[float]:
    """
    Generates an embedding vector for the given text using the specified model.
    """
    if not text or not text.strip():
        logger.warning("Empty text for embedding, returning zero vector.")
        return [0.0] * 768

    try:
        resp = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="RETRIEVAL_DOCUMENT"
        )
        # get embedding from object or dict
        emb = getattr(resp, 'embedding', None) or (resp.get('embedding') if isinstance(resp, dict) else None)
        if isinstance(emb, list) and len(emb) == 768:
            return emb
        logger.error(f"Unexpected embedding format: {type(emb)} with length {len(emb) if hasattr(emb,'__len__') else 'N/A'}")
    except Exception as e:
        logger.error(f"Embedding error: {e}", exc_info=True)
    return []


def create_recipe_text_for_embedding(recipe: dict) -> str:
    """
    Builds a string for embedding from recipe fields.
    """
    name = recipe.get('name', '')
    desc = recipe.get('description', '')
    ingredients = ' '.join(recipe.get('cleaned_ingredients', []))
    cat = recipe.get('maincategory', '')
    sub = recipe.get('subcategory', '')
    dish = recipe.get('dish_type', '')
    return f"Recipe: {name}. Category: {cat} ({sub}, {dish}). Description: {desc}. Ingredients: {ingredients}.".strip()


def parse_ingredient_name(text: str) -> str:
    """
    Cleans an ingredient string by removing measurements, descriptors, and corrections.
    """
    # Normalize and strip parenthetical info
    txt = PAREN_REGEX.sub('', text.lower()).strip()
    # Split on whitespace, clean tokens, and filter
    tokens = []
    for word in txt.split():
        w = NON_ALNUM_REGEX.sub('', word).strip('-')
        if w and w not in FILTER_WORDS and not any(char.isdigit() for char in w):
            tokens.append(w)
    cleaned = ' '.join(tokens)
    # Apply corrections if key present
    return CORRECTIONS.get(cleaned, cleaned)
