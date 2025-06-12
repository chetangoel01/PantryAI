import json
from db import supabase
from utils.logger import logger
import time

def interactive_clean_ingredients():
    logger.info("Starting interactive cleaning of recipes' 'cleaned_ingredients_list'...")

    # Fetch all recipe IDs and their current 'cleaned_ingredients_list'
    # Fetch in batches to avoid memory issues with very large datasets
    # and to allow for resuming if interrupted.
    offset = 0
    limit = 50 # Adjust batch size as needed
    total_recipes_processed = 0

    while True:
        try:
            res = supabase.table('recipes').select('id', 'name', 'cleaned_ingredients_list').order('id').range(offset, offset + limit - 1).execute()
            recipes_batch = res.data

            if not recipes_batch:
                logger.info("No more recipes to process or reached end.")
                break

            for recipe in recipes_batch:
                recipe_id = recipe['id']
                recipe_name = recipe['name']
                current_cleaned_list = recipe.get('cleaned_ingredients_list', [])

                logger.info(f"\n--- Recipe ID: {recipe_id} ---")
                logger.info(f"Recipe Name: {recipe_name}")
                logger.info(f"Current Cleaned Ingredients: {current_cleaned_list}")

                print("\nEnter new cleaned ingredients (comma-separated, e.g., 'salt,pepper,chicken').")
                print("Press Enter to keep current list. Type 'skip' to skip this recipe without saving.")
                user_input = input("Your input: ").strip()

                if user_input.lower() == 'exit':
                    logger.info("Exiting interactive cleaning.")
                    return
                elif user_input.lower() == 'skip':
                    logger.info(f"Skipping recipe ID {recipe_id}.")
                    continue
                elif user_input:
                    # Parse user input into a list, clean each item, remove duplicates, and sort
                    edited_list = [item.strip().lower() for item in user_input.split(',') if item.strip()]
                    edited_list = sorted(list(set(edited_list)))
                    
                    if edited_list == current_cleaned_list:
                        logger.info("No changes made. Keeping current list.")
                        continue

                    logger.info(f"New Cleaned Ingredients: {edited_list}")
                    confirm = input("Confirm update (y/N)? ").strip().lower()
                    if confirm == 'y':
                        try:
                            update_res = supabase.table('recipes').update({'cleaned_ingredients_list': edited_list}).eq('id', recipe_id).execute()
                            if update_res.data:
                                logger.info(f"Successfully updated recipe ID {recipe_id}.")
                            elif update_res.error:
                                logger.error(f"Error updating recipe ID {recipe_id}: {update_res.error}")
                        except Exception as e:
                            logger.error(f"General error during update for recipe ID {recipe_id}: {e}", exc_info=True)
                    else:
                        logger.info("Update cancelled for this recipe.")
                else:
                    logger.info("Input was empty. Keeping current list.")
                
                total_recipes_processed += 1

            offset += limit
            logger.info(f"Processed {total_recipes_processed} recipes so far. Moving to next batch...")
            time.sleep(0.1) # Small delay to prevent hammering the API

        except Exception as e:
            logger.error(f"Error fetching batch of recipes: {e}", exc_info=True)
            logger.info("Attempting to resume from current offset after 5 seconds...")
            time.sleep(5) # Wait before retrying in case of temporary network issue

    logger.info("Interactive cleaning complete. All recipes processed.")

if __name__ == "__main__":
    # Ensure your .env has SUPABASE_URL and SUPABASE_KEY.
    # Make sure you've already run the 'ALTER TABLE' step to add 'cleaned_ingredients_list' column.
    # It's also recommended to have run the initial migration script at least once.
    interactive_clean_ingredients()