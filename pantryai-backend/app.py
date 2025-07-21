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
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PantryAI - Smart Pantry Management</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 { 
            color: #007AFF; 
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .nav-links {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .nav-links a {
            color: #007AFF;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 500;
            padding: 10px 20px;
            border-radius: 6px;
            transition: background-color 0.3s;
        }
        .nav-links a:hover {
            background-color: #e3f2fd;
        }
        .api-info {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
            text-align: left;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007AFF;
        }
        .feature-card h3 {
            color: #007AFF;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 PantryAI</h1>
        <p class="subtitle">Smart Pantry Management with AI-Powered Scanning</p>
        
        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/support">Support</a>
        </div>

        <div class="feature-grid">
            <div class="feature-card">
                <h3>📱 Smart Scanning</h3>
                <p>Scan receipts and grocery items with advanced OCR technology. All processing happens on your device for maximum privacy.</p>
            </div>
            <div class="feature-card">
                <h3>🏠 Pantry Management</h3>
                <p>Keep track of all your food items, expiration dates, and quantities in one organized place.</p>
            </div>
            <div class="feature-card">
                <h3>👨‍🍳 Recipe Recommendations</h3>
                <p>Get personalized recipe suggestions based on ingredients you already have in your pantry.</p>
            </div>
            <div class="feature-card">
                <h3>📊 Shopping Lists</h3>
                <p>Generate smart shopping lists and never forget essential ingredients again.</p>
            </div>
        </div>

        <div class="api-info">
            <h3>🔧 API Endpoints</h3>
            <p>For developers and integrations:</p>
            <ul>
                <li><strong>GET /recipes/match</strong> - Get recipe recommendations based on pantry items</li>
                <li><strong>GET /recipes/search</strong> - Search for specific recipes</li>
                <li><strong>POST /scan</strong> - Process scanned text for item identification</li>
                <li><strong>GET /pantry</strong> - Retrieve pantry items</li>
            </ul>
        </div>

        <div class="footer">
            <p>© 2024 PantryAI. All rights reserved.</p>
            <p>Transform your kitchen with intelligent pantry management.</p>
        </div>
    </div>
</body>
</html>
    ''', 200, {'Content-Type': 'text/html'}

@app.route('/privacy')
def privacy_policy():
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - PantryAI</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #007AFF; 
            border-bottom: 2px solid #007AFF; 
            padding-bottom: 10px; 
            margin-bottom: 30px;
        }
        h2 { 
            color: #555; 
            margin-top: 30px; 
            margin-bottom: 15px;
        }
        h3 {
            color: #666;
            margin-top: 20px;
        }
        .last-updated { 
            background: #f0f8ff; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #007AFF;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .highlight {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .contact-info {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy for PantryAI</h1>
        
        <div class="last-updated">
            <strong>Last Updated:</strong> July 21, 2024
        </div>

        <h2>1. Introduction</h2>
        <p>Welcome to PantryAI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.</p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <ul>
            <li><strong>Pantry Items:</strong> Food items, quantities, expiration dates, and purchase information you add to your pantry</li>
            <li><strong>Recipe Preferences:</strong> Your saved recipes and cooking preferences</li>
            <li><strong>Account Information:</strong> Device ID and app usage data</li>
        </ul>

        <h3>2.2 Information We Collect Automatically</h3>
        <ul>
            <li><strong>Camera Data:</strong> Images you scan for OCR text recognition (processed on-device)</li>
            <li><strong>Usage Analytics:</strong> App performance and usage statistics</li>
            <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
        </ul>

        <div class="highlight">
            <strong>🔒 Privacy-First Design:</strong> All OCR processing happens on your device using ML Kit. Images are not uploaded to our servers for text recognition.
        </div>

        <h2>3. How We Use Your Information</h2>
        <ul>
            <li>Provide and maintain the PantryAI service</li>
            <li>Process images for text recognition to identify grocery items</li>
            <li>Generate recipe recommendations based on your pantry</li>
            <li>Improve our app functionality and user experience</li>
            <li>Send you updates and notifications about the app</li>
        </ul>

        <h2>4. Data Processing and Storage</h2>
        <h3>4.1 On-Device Processing</h3>
        <p>Text recognition (OCR) is performed on your device using ML Kit. Images are not uploaded to our servers for OCR processing.</p>

        <h3>4.2 Cloud Storage</h3>
        <p>Your pantry data and preferences are stored securely in the cloud to sync across your devices and provide backup.</p>

        <h2>5. Data Sharing</h2>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
        <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
        </ul>

        <h2>6. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information:</p>
        <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure cloud infrastructure</li>
            <li>Regular security audits</li>
        </ul>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Opt-out of certain data processing</li>
        </ul>

        <h2>8. Children's Privacy</h2>
        <p>Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app.</p>

        <div class="contact-info">
            <h2>10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p><strong>Email:</strong> privacy@pantryai.dragonchetan.com</p>
            <p><strong>Website:</strong> https://pantryai.dragonchetan.com</p>
        </div>

        <h2>11. California Privacy Rights</h2>
        <p>California residents have additional rights under the California Consumer Privacy Act (CCPA). Please contact us for more information.</p>

        <h2>12. International Users</h2>
        <p>If you are using our app from outside the United States, please note that your information may be transferred to and processed in the United States.</p>
    </div>
</body>
</html>
    ''', 200, {'Content-Type': 'text/html'}

@app.route('/support')
def support():
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support - PantryAI</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #007AFF; 
            border-bottom: 2px solid #007AFF; 
            padding-bottom: 10px; 
            margin-bottom: 30px;
        }
        h2 { 
            color: #555; 
            margin-top: 30px; 
            margin-bottom: 15px;
        }
        h3 {
            color: #666;
            margin-top: 20px;
        }
        .faq-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #007AFF;
        }
        .faq-question {
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 10px;
        }
        .faq-answer {
            color: #555;
        }
        .feature-card {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #28a745;
        }
        .contact-info {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .tip {
            background: #d1ecf1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #17a2b8;
            margin: 15px 0;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .nav-links {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .nav-links a {
            color: #007AFF;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 500;
        }
        .nav-links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Support Center - PantryAI</h1>
        
        <div class="nav-links">
            <a href="/">Home</a> | 
            <a href="/privacy">Privacy Policy</a> | 
            <a href="/support">Support</a>
        </div>

        <h2>🚀 Getting Started</h2>
        <div class="feature-card">
            <h3>📱 Smart Grocery Scanning</h3>
            <p>Use your camera to scan receipts and grocery items. Our AI will automatically identify products and add them to your pantry.</p>
            <ul>
                <li>Point your camera at a receipt or product</li>
                <li>Tap the scan button</li>
                <li>Review and confirm the detected items</li>
                <li>Items are automatically added to your pantry</li>
            </ul>
        </div>

        <div class="feature-card">
            <h3>🏠 Managing Your Pantry</h3>
            <p>Keep track of all your food items in one organized place.</p>
            <ul>
                <li>View all items by category or location</li>
                <li>Set expiration date reminders</li>
                <li>Track quantities and update as needed</li>
                <li>Add notes and custom information</li>
            </ul>
        </div>

        <div class="feature-card">
            <h3>👨‍🍳 Recipe Recommendations</h3>
            <p>Discover delicious recipes based on ingredients you already have.</p>
            <ul>
                <li>Get personalized recipe suggestions</li>
                <li>Filter by cooking time and difficulty</li>
                <li>Save your favorite recipes</li>
                <li>Generate shopping lists for missing ingredients</li>
            </ul>
        </div>

        <h2>❓ Frequently Asked Questions</h2>
        
        <div class="faq-item">
            <div class="faq-question">How does the scanning feature work?</div>
            <div class="faq-answer">Our app uses advanced OCR (Optical Character Recognition) technology to read text from images. All processing happens on your device for maximum privacy. Simply point your camera at a receipt or product label and the app will identify items automatically.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">Is my data private and secure?</div>
            <div class="faq-answer">Yes! We prioritize your privacy. All OCR processing happens on your device, and your data is encrypted both in transit and at rest. We never sell or share your personal information with third parties.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">How do I add items manually?</div>
            <div class="faq-answer">Tap the "+" button in the pantry tab to add items manually. You can specify the name, category, quantity, expiration date, and other details.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">Can I share my pantry with family members?</div>
            <div class="faq-answer">Currently, each device maintains its own pantry. We're working on family sharing features for future updates.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">How do I get recipe recommendations?</div>
            <div class="faq-answer">Navigate to the Recipes tab to see personalized suggestions based on your pantry items. You can also search for specific recipes or browse by category.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">What if the scanning doesn't work properly?</div>
            <div class="faq-answer">Ensure good lighting and hold your camera steady. For best results, scan receipts on a flat surface with even lighting. If items aren't detected correctly, you can edit them manually after scanning.</div>
        </div>

        <h2>💡 Tips for Best Results</h2>
        
        <div class="tip">
            <strong>📸 Scanning Tips:</strong>
            <ul>
                <li>Ensure good lighting when scanning</li>
                <li>Hold your device steady</li>
                <li>Scan receipts on a flat surface</li>
                <li>Keep the camera at a reasonable distance</li>
            </ul>
        </div>

        <div class="tip">
            <strong>🏠 Pantry Management Tips:</strong>
            <ul>
                <li>Regularly update quantities as you use items</li>
                <li>Set realistic expiration dates</li>
                <li>Use categories to organize your pantry</li>
                <li>Check expiration alerts regularly</li>
            </ul>
        </div>

        <div class="tip">
            <strong>👨‍🍳 Recipe Tips:</strong>
            <ul>
                <li>Keep your pantry updated for better recommendations</li>
                <li>Save recipes you enjoy for quick access</li>
                <li>Use the shopping list feature for missing ingredients</li>
                <li>Try different recipe categories to discover new dishes</li>
            </ul>
        </div>

        <h2>🐛 Troubleshooting</h2>
        
        <div class="faq-item">
            <div class="faq-question">The app crashes when I try to scan</div>
            <div class="faq-answer">Try restarting the app and ensure you have granted camera permissions. If the issue persists, try updating to the latest version of the app.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">My pantry items aren't syncing</div>
            <div class="faq-answer">Check your internet connection and try refreshing the app. If the issue continues, try logging out and back in.</div>
        </div>

        <div class="faq-item">
            <div class="faq-question">Recipe recommendations aren't showing</div>
            <div class="faq-answer">Make sure you have items in your pantry. The more items you add, the better the recommendations will be.</div>
        </div>

        <div class="contact-info">
            <h2>📞 Contact Support</h2>
            <p>Need additional help? We're here to assist you!</p>
            <p><strong>Email:</strong> support@pantryai.dragonchetan.com</p>
            <p><strong>Response Time:</strong> Within 24 hours</p>
            <p><strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</p>
            <p>When contacting support, please include:</p>
            <ul>
                <li>Your device model and OS version</li>
                <li>App version (found in Settings)</li>
                <li>Detailed description of the issue</li>
                <li>Screenshots if applicable</li>
            </ul>
        </div>

        <div class="nav-links">
            <a href="/">Home</a> | 
            <a href="/privacy">Privacy Policy</a> | 
            <a href="/support">Support</a>
        </div>
    </div>
</body>
</html>
    ''', 200, {'Content-Type': 'text/html'}

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