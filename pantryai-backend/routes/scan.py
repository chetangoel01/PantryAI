# routes/scan.py

from flask import Blueprint, request, jsonify
from ocr import extract_text
from parsers import parse_receipt_google, parse_items
from db import supabase # Still needed if you interact with DB for other scan-related tasks
from utils.logger import logger
from datetime import datetime, timedelta

scan_bp = Blueprint('scan', __name__)

@scan_bp.route('/scan', methods=['POST'])
def scan_receipt():
    if 'file' not in request.files:
        return jsonify(error="No file sent"), 400
    try:
        raw_text = extract_text(request.files['file'])
        if not raw_text.strip():
            return jsonify(error="Could not extract text"), 400
        try:
            items = parse_receipt_google(raw_text)
        except Exception as parse_e: # Catch parse errors specifically
            logger.warning("Google LLM parse failed, attempting fallback parser.", exc_info=parse_e)
            try:
                items = parse_items(raw_text)
            except Exception as fallback_e:
                logger.error("Both parsers failed.", exc_info=fallback_e)
                return jsonify(error=f"Failed to parse receipt: {fallback_e}"), 500
    except Exception as e:
        logger.error("Error in /scan (file extraction or initial parsing setup)", exc_info=e)
        return jsonify(error=str(e)), 500

    # Clean and enrich for display/preparation, but DO NOT INSERT YET
    now = datetime.utcnow()
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
            "expiry": it.get("expiry") or (now.date() + timedelta(days=7)).isoformat(), # Use 'expiry' here as it's the output from parse_receipt_google
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