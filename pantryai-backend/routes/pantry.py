from flask import Blueprint, request, jsonify
from db import supabase
from utils.logger import logger
from datetime import datetime, timedelta # Import these for date handling

pantry_bp = Blueprint('pantry', __name__)

def get_device_id():
    device_id = request.headers.get("X-Device-ID")
    if not device_id:
        raise ValueError("Missing X-Device-ID header")
    return device_id


@pantry_bp.route('/pantry', methods=['GET'])
def list_pantry():
    try:
        device_id = get_device_id()
        res = supabase.table('pantry').select('*').eq('device_id', device_id).execute()
        return jsonify(res.data), 200
    except Exception as e:
        logger.error("Error fetching pantry", exc_info=e)
        return jsonify(error=str(e)), 500

@pantry_bp.route('/pantry/<item_id>', methods=['PUT'])
def update_pantry_item(item_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify(error="No data provided"), 400

        # Validate and process dates if they exist
        if 'expiry' in data:
            try:
                data['expiry'] = datetime.fromisoformat(data['expiry']).date().isoformat()
            except ValueError:
                return jsonify(error="Invalid expiry date format"), 400

        if 'purchase_date' in data:
            try:
                data['purchase_date'] = datetime.fromisoformat(data['purchase_date']).date().isoformat()
            except ValueError:
                return jsonify(error="Invalid purchase date format"), 400

        device_id = get_device_id()
        res = supabase.table('pantry').update(data).eq('id', item_id).eq('device_id', device_id).execute()
        
        if not res.data:
            return jsonify(error="Item not found"), 404
            
        return jsonify(res.data[0]), 200
    except Exception as e:
        logger.error(f"Error updating pantry item {item_id}", exc_info=e)
        return jsonify(error=str(e)), 500

@pantry_bp.route('/pantry/<item_id>', methods=['DELETE'])
def delete_pantry_item(item_id):
    try:
        logger.info(f"Attempting to delete pantry item with ID: {item_id}")
        
        device_id = get_device_id()
        check = supabase.table('pantry').select('id').eq('id', item_id).eq('device_id', device_id).execute()
        if not check.data:
            logger.warning(f"Item not found for deletion: {item_id}")
            return jsonify(error="Item not found"), 404

        # Perform the deletion
        res = supabase.table('pantry').delete().eq('id', item_id).eq('device_id', device_id).execute()
        
        if not res.data:
            logger.error(f"Deletion failed for item {item_id}: No data returned")
            return jsonify(error="Failed to delete item"), 500
            
        logger.info(f"Successfully deleted item {item_id}")
        return jsonify({"message": "Item deleted successfully", "deleted_id": item_id}), 200
        
    except Exception as e:
        logger.error(f"Error deleting pantry item {item_id}", exc_info=e)
        return jsonify(error=str(e)), 500

@pantry_bp.route('/pantry/confirm-add', methods=['POST'])
def confirm_add_items():
    """
    Endpoint for a user to confirm the addition of parsed items to their pantry.
    Expects a JSON payload with a list of items to insert.
    """
    data = request.get_json()
    device_id = get_device_id()

    if not data or 'items' not in data or not isinstance(data['items'], list):
        return jsonify(error="Invalid request payload. Expected a list of 'items'."), 400

    items_to_insert = data['items']

    if not items_to_insert:
        # It's better to return 200 with a message if an empty list is sent for confirmation,
        # as it's not strictly an error, just no items to process.
        return jsonify(message="No items to add."), 200

    # Perform final validation and standardization before insertion.
    # This acts as a safeguard, especially if the user had a chance to edit items on the frontend.
    processed_items_for_db = []
    now_utc = datetime.utcnow()
    iso_now_z = now_utc.isoformat(timespec='microseconds') + "Z" # Current UTC timestamp with microseconds and 'Z'
    today_iso = now_utc.date().isoformat() # Current date

    for item in items_to_insert:
        # Basic validation and defaulting for each field
        name = item.get("name")
        if not name:
            logger.warning(f"Skipping item due to missing 'name' during confirmation: {item}")
            continue # Don't insert items without a name

        quantity = item.get("quantity", 1)
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            logger.warning(f"Invalid 'quantity' value '{item.get('quantity')}' for item '{name}', defaulting to 1.")
            quantity = 1

        is_opened = bool(item.get("is_opened", False))

        # Ensure dates are in YYYY-MM-DD format or default
        expiry_date = item.get("expiry")
        if expiry_date:
            try:
                # Attempt to re-parse or validate ISO format
                expiry_date = datetime.fromisoformat(expiry_date).date().isoformat()
            except ValueError:
                logger.warning(f"Invalid 'expiry' date format '{expiry_date}' for item '{name}', defaulting to 7 days from now.")
                expiry_date = (now_utc.date() + timedelta(days=7)).isoformat()
        else:
            expiry_date = (now_utc.date() + timedelta(days=7)).isoformat() # Default expiry if none provided

        purchase_date = item.get("purchase_date")
        if purchase_date:
            try:
                purchase_date = datetime.fromisoformat(purchase_date).date().isoformat()
            except ValueError:
                logger.warning(f"Invalid 'purchase_date' format '{purchase_date}' for item '{name}', defaulting to today.")
                purchase_date = today_iso
        else:
            purchase_date = today_iso # Default purchase date if none provided

        # Construct the item for database insertion
        processed_items_for_db.append({
            "name": name,
            "category": item.get("category", "Uncategorized"),
            "quantity": quantity,
            "unit": item.get("unit"),
            "expiry": expiry_date,
            "purchase_date": purchase_date,
            "location": item.get("location", "Pantry"),
            "brand": item.get("brand"),
            "barcode": item.get("barcode"),
            "notes": item.get("notes"),
            "is_opened": is_opened,
            "added_at": item.get("added_at") or iso_now_z, # Use timestamp from frontend or current UTC
            "device_id": device_id
        })

    if not processed_items_for_db:
        return jsonify(error="No valid items to insert after server-side processing."), 400

    try:
        # Perform the actual Supabase insert
        res = supabase.table('pantry').insert(processed_items_for_db).execute()
        return jsonify(inserted=res.data), 201
    except Exception as e:
        logger.error("Supabase insert error during pantry confirmation", exc_info=e)
        return jsonify(error=f"Failed to add items to pantry: {e}"), 500

@pantry_bp.route('/pantry/search', methods=['GET'])
def search_pantry():
    try:
        query = request.args.get('query', '').strip()
        if not query:
            return jsonify([]), 200

        device_id = get_device_id()
        res = supabase.table('pantry').select('*').ilike('name', f'%{query}%').eq('device_id', device_id).execute()

        return jsonify(res.data), 200
    except Exception as e:
        logger.error("Error searching pantry", exc_info=e)
        return jsonify(error=str(e)), 500