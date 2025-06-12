import json
import os

def load_and_combine_recipes(data_dir="data"):
    """
    Loads all JSON recipe files from a directory and combines them into a single list.
    """
    all_recipes = []
    json_files = ["recipes.json", "inspiration.json", "baking.json", "health.json", "budget.json"]

    for filename in json_files:
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} not found. Please ensure all JSON files are in the '{data_dir}' directory.")
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # The structure is a dict with a single key "recipes" containing the list
            if isinstance(data, dict) and "recipes" in data:
                all_recipes.extend(data["recipes"])
            else:
                # Handle cases where the top-level might just be the list
                all_recipes.extend(data)
    print(f"Loaded {len(all_recipes)} recipes.")
    return all_recipes

# Example usage:
# Make sure to create a 'data' directory in your pantryai-backend folder
# and place all downloaded JSON files inside it.
# combined_recipes = load_and_combine_recipes(data_dir='./pantryai-backend/data')
# print(combined_recipes[0]) # Check the first recipe