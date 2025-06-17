# routes/scan.py

from flask import Blueprint, request, jsonify
from parsers import parse_receipt_google, parse_items
from db import supabase
from utils.logger import logger
from datetime import datetime, timedelta

scan_bp = Blueprint('scan', __name__)

@scan_bp.route('/scan', methods=['POST'])
def scan_receipt():
    try:
        data = request.get_json()
        if not data or 'parsed_text' not in data:
            return jsonify(error="No parsed text received"), 400
            
        raw_text = data['parsed_text']
        if not raw_text.strip():
            return jsonify(error="No text content to parse"), 400

        try:
            items = parse_receipt_google(raw_text)
        except Exception as parse_e:
            logger.warning("Google LLM parse failed, attempting fallback parser.", exc_info=parse_e)
            try:
                items = parse_items(raw_text)
            except Exception as fallback_e:
                logger.error("Both parsers failed.", exc_info=fallback_e)
                return jsonify(error=f"Failed to parse receipt: {fallback_e}"), 500

        # Clean and enrich for display/preparation, but DO NOT INSERT YET
        now = datetime.now(datetime.UTC)
        today = now.date().isoformat()
        iso_now = now.isoformat() + "Z" # Ensure ISO 8601 with Z for UTC
        formatted_for_frontend = []
        for it in items:
            quantity = 1
            if 'quantity' in it and it['quantity'] is not None:
                try:
                    quantity = int(it['quantity'])
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert quantity '{it['quantity']}' to int for display, defaulting to 1.")

            is_opened = bool(it.get("is_opened", False))

            formatted_for_frontend.append({
                "name": it.get("name"),
                "category": it.get("category", "Uncategorized"),
                "quantity": quantity,
                "unit": it.get("unit"),
                "expiry": it.get("expiry") or (now.date() + timedelta(days=7)).isoformat(),
                "purchase_date": it.get("purchase_date") or today,
                "location": it.get("location", "Pantry"),
                "brand": it.get("brand"),
                "barcode": it.get("barcode"),
                "notes": it.get("notes"),
                "is_opened": is_opened,
                "added_at": it.get("added_at") or iso_now,
            })

        # Return the parsed items to the frontend for confirmation
        return jsonify(parsed_items=formatted_for_frontend), 200

    except Exception as e:
        logger.error("Error in /scan endpoint", exc_info=e)
        return jsonify(error=str(e)), 500