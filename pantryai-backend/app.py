from flask import Flask, jsonify
from routes.recipes import recipes_bp
from routes.pantry import pantry_bp
from routes.scan import scan_bp
from utils.logger import logger
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(recipes_bp)         # already /recipes/...
app.register_blueprint(pantry_bp)          # exposes GET  /pantry
app.register_blueprint(scan_bp)            # exposes POST /scan

# Basic Flask routes
@app.route('/')
def home():
    return jsonify(message="Welcome to PantryAI! Use /recipes/match or /recipes/search."), 200

# Error handling
@app.errorhandler(404)
def not_found(error):
    return jsonify(error="Not Found"), 404

@app.errorhandler(500)
def internal_error(error):
    logger.exception("Internal Server Error") # Log the full traceback
    return jsonify(error="Internal Server Error"), 500

if __name__ == '__main__':
    # This block only runs when app.py is executed directly.
    # For production, gunicorn will manage workers and call the 'app' object.
    logger.info("Running Flask app in development mode.")
    app.run(debug=True, host='0.0.0.0', port=5000)