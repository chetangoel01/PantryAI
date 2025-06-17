import re
import json
import google.generativeai as genai
from google.generativeai import GenerativeModel
from config import Config
from utils.logger import logger

# Configure LLM API
genai.configure(api_key=Config.GOOGLE_API_KEY)
google_model = GenerativeModel(model_name="gemini-2.0-flash")

def parse_items(raw_text: str) -> list[dict]:
    """
    Fallback parser: extract lines without prices, parse leading quantity if available.
    """
    items = []
    for line in raw_text.splitlines():
        if not line.strip() or re.search(r'\$\s*\d+\.?\d*', line):
            continue
        m = re.match(r'(?:^|\s*)(\d+)\s+(.*)', line.strip())
        if m:
            try:
                qty = int(m.group(1))
                name = m.group(2).strip()
            except ValueError:
                qty = 1
                name = line.strip()
        else:
            qty = 1
            name = line.strip()
        if name:
            items.append({"name": name.lower(), "quantity": qty})
    return items


import json
from datetime import datetime, timedelta
from utils.logger import logger
# Assuming google_model is already imported and configured

def parse_receipt_google(raw_text: str) -> list[dict]:
    """
    Use Gemini LLM to parse structured fields from raw receipt text,
    with enhanced handling for edge cases and data enrichment.
    """
    prompt = (
        "You are an expert data extraction AI specializing in pantry items from receipt text.\n"
        "Your goal is to accurately identify and extract details for each item, even with imperfect input.\n"
        "For each item, return a JSON array of objects with the following keys and data types:\n"
        "- `itemName`: string (e.g., 'Milk', 'Bread', 'Organic Apples')\n"
        "- `itemCategory`: string. Must be one of: 'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 'Dry Goods', "
          "'Canned & Jarred', 'Baking', 'Frozen Foods', 'Beverages', 'Snacks & Sweets', 'Condiments & Sauces', "
          "'Oils & Vinegars', 'Spices & Seasonings', 'International Foods', 'Health & Wellness', 'Personal Care', "
          "'Household Supplies', 'Baby & Kids', 'Pet Supplies', 'Other'. Infer the most specific category based on the item name. "
          "If uncertain, use 'Other'.\n"
        "- `itemQuantity`: number (e.g., 1, 2.5). Parse numerical quantity. If only a phrase like 'a bag' "
          "is present, infer 1. Prioritize explicit numbers.\n"
        "- `itemUnit`: string. Must be one of: 'pcs', 'kg', 'g', 'l', 'ml', 'oz', 'lb'. "
          "Extract explicit units. If no unit is specified but a quantity is, use 'pcs'.\n"
        "- `expirationDate`: string (YYYY-MM-DD) or null. Look for explicit dates. "
          "If not found, infer a reasonable future expiration based on the item category (e.g., dairy short, canned goods long). "
          "Prioritize any mentioned date formats (e.g., MM/DD/YY, DD-MM-YYYY) and convert to YYYY-MM-DD.\n"
        "- `purchaseDate`: string (YYYY-MM-DD) or null. Look for an explicit date on the receipt. "
          "If not found, assume today's date based on the current context. Convert to YYYY-MM-DD.\n"
        "- `storageLocation`: string (e.g., 'Pantry', 'Refrigerator', 'Freezer', 'Cupboard'). "
          "Infer the most common storage location for the item. Default to 'Pantry' if unsure.\n"
        "- `itemBrand`: string or null (e.g., 'Horizon Organic', 'Dave's Killer Bread'). "
          "Extract the brand name if clearly visible. If multiple words, try to pick the most likely brand.\n"
        "- `barcodeNumber`: string or null. Extract any numeric sequences that resemble barcodes.\n"
        "- `itemNotes`: string or null. Any other relevant details about the item (e.g., 'organic', 'low-fat', 'discounted').\n"
        "- `isOpened`: boolean. Infer if the item appears to be opened or consumed (e.g., 'half-used', 'opened bag'). Default to false.\n"
        "- `addedAt`: string (ISO 8601). Set to the current UTC timestamp when parsing occurs.\n\n"
        "**Edge Cases and Inference Guidance:**\n"
        "1.  **Missing Quantity/Unit:** If a quantity is implied but not explicit (e.g., 'Milk'), default `itemQuantity` to 1 and `itemUnit` to a reasonable default ('gallon', 'carton', 'each').\n"
        "2.  **Ambiguous Items:** If an item name is vague (e.g., 'Produce'), try to infer a more specific name if context allows, or keep it general.\n"
        "3.  **Date Formats:** Be flexible with date parsing (e.g., MM/DD/YY, DD/MM, YYYY-MM-DD) and always convert to YYYY-MM-DD.\n"
        "4.  **Inferred Dates:** If `expirationDate` or `purchaseDate` are not explicitly on the receipt, use reasonable defaults:\n"
        f"    - `expirationDate`: infer a default based on `itemCategory` (e.g., 7 days for dairy, 30-90 for produce, 365+ for canned/dry goods).\n"
        f"    - `purchaseDate`: assume today's date (which is {datetime.now().strftime('%Y-%m-%d')}).\n"
        "5.  **Boolean Inference:** `isOpened` should be true if phrases like 'opened', 'partially used', 'damaged box' are present.\n"
        "6.  **Case Sensitivity:** Normalize names and categories to a consistent casing (e.g., Title Case or Sentence case for `itemName`, Title Case for `itemCategory`, `storageLocation`, `itemBrand`).\n"
        "7.  **Null Values:** If a field cannot be reasonably inferred or extracted, explicitly set it to `null`.\n"
        "8.  **Output Format:** Strictly adhere to the JSON array of objects format. Do not include any preamble, postamble, or conversational text.\n\n"
        f"Receipt Text:\n```\n{raw_text}\n```\n\n"
        "Return ONLY the JSON array. Example: [\n"
        "  {\n"
        "    \"itemName\": \"Whole Milk\",\n"
        "    \"itemCategory\": \"Dairy\",\n"
        "    \"itemQuantity\": 1,\n"
        "    \"itemUnit\": \"gallon\",\n"
        "    \"expirationDate\": \"2025-06-19\",\n"
        "    \"purchaseDate\": \"2025-06-12\",\n"
        "    \"storageLocation\": \"Refrigerator\",\n"
        "    \"itemBrand\": \"Generic Brand\",\n"
        "    \"barcodeNumber\": null,\n"
        "    \"itemNotes\": null,\n"
        "    \"isOpened\": false,\n"
        "    \"addedAt\": \"2025-06-12T11:55:00.000000\"\n"
        "  }\n"
        "]\n"
        "Ensure `addedAt` is an ISO 8601 string including microseconds (e.g., 'YYYY-MM-DDTHH:MM:SS.ffffff')."
    )

    try:
        # Use a more descriptive model if available (e.g., gemini-1.5-pro-latest)
        # and consider a lower temperature for more deterministic JSON output.
        # Ensure 'google_model' is configured to use a model that supports structured output well.
        resp = google_model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2, # Lower temperature for more precise JSON
            }
        )

        # It's good practice to validate the JSON even if response_mime_type is set,
        # as LLMs can occasionally hallucinate malformed JSON.
        data = json.loads(resp.text)

        # Further client-side validation/standardization if needed
        # (e.g., ensuring all expected keys are present, converting types again)
        # This acts as a safeguard against subtle LLM errors.
        processed_data = []
        current_utc_iso = datetime.utcnow().isoformat()
        current_date_iso = datetime.utcnow().date().isoformat()

        for item in data:
            # Apply defaults and type conversions here as well, in case LLM misses them
            name = item.get("itemName")
            if not name:
                logger.warning(f"Item with no name found: {item}")
                continue # Skip items without a name, or assign a default like "Unknown Item"

            quantity = item.get("itemQuantity")
            try:
                quantity = float(quantity) if quantity is not None else 1.0
            except (ValueError, TypeError):
                quantity = 1.0 # Default if conversion fails

            unit = item.get("itemUnit")
            if unit is None and quantity == 1.0:
                unit = "each" # Infer 'each' if quantity is 1 and unit is missing

            # Better expiration date inference/parsing
            expiration_date = item.get("expirationDate")
            if expiration_date:
                try:
                    # Attempt to parse common date formats
                    if len(expiration_date) == 10 and '-' in expiration_date: # YYYY-MM-DD
                        datetime.strptime(expiration_date, '%Y-%m-%d').date().isoformat()
                    elif len(expiration_date) == 8 and '/' in expiration_date: # MM/DD/YY
                        parts = expiration_date.split('/')
                        year = int(parts[2])
                        # Handle 2-digit years (e.g., '23' -> '2023')
                        if year < 100:
                            year += 2000 if year <= (datetime.now().year % 100 + 5) else 1900 # A heuristic
                        expiration_date = datetime(year, int(parts[0]), int(parts[1])).date().isoformat()
                    else:
                        # Fallback for less common formats, try general parsing
                        parsed_date = datetime.fromisoformat(expiration_date)
                        expiration_date = parsed_date.date().isoformat()
                except (ValueError, TypeError):
                    logger.warning(f"Could not parse expirationDate '{expiration_date}', inferring default.")
                    expiration_date = (datetime.utcnow().date() + timedelta(days=90)).isoformat() # Default inference
            else:
                # LLM should infer, but if not, provide a reasonable default
                expiration_date = (datetime.utcnow().date() + timedelta(days=90)).isoformat() # Default inference

            purchase_date = item.get("purchaseDate")
            if not purchase_date:
                purchase_date = current_date_iso # Default to current date if not found

            is_opened = bool(item.get("isOpened", False)) # Ensure boolean type

            added_at = item.get("addedAt")
            if not added_at:
                added_at = current_utc_iso + "Z" # Ensure ISO 8601 with Z for UTC

            processed_data.append({
                "name": name,
                "category": item.get("itemCategory", "Uncategorized"),
                "quantity": quantity,
                "unit": unit,
                "expiry": expiration_date,
                "purchase_date": purchase_date,
                "location": item.get("storageLocation", "Pantry"),
                "brand": item.get("itemBrand"),
                "barcode": item.get("barcodeNumber"),
                "notes": item.get("itemNotes"),
                "is_opened": is_opened,
                "added_at": added_at,
            })
        return processed_data
    except json.JSONDecodeError as e:
        logger.error(f"LLM returned malformed JSON: {resp.text[:500]}...", exc_info=e)
        raise ValueError(f"LLM did not return valid JSON: {e}")
    except Exception as e:
        logger.error("LLM parser failed during content generation or post-processing", exc_info=e)
        raise # Re-raise to be caught by the calling function's error handling