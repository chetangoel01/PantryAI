# PantryAI Backend API

Flask-based REST API for the PantryAI mobile application, providing recipe matching, pantry management, and ingredient scanning capabilities.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip
- Virtual environment (recommended)

### Local Development Setup

1. **Clone and navigate to the backend directory**:
   ```bash
   cd pantryai-backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   # Create .env file with your configuration
   cp .env.example .env
   ```

5. **Run the development server**:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5001`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
FLASK_DEBUG=True
GOOGLE_API_KEY=your_google_ai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Required API Keys

- **Google AI API**: Used for recipe matching and ingredient recognition
- **Supabase**: Database and authentication service

## 📊 API Endpoints

### Core Endpoints

- `GET /` - API documentation and health check
- `GET /health` - Health check endpoint

### Pantry Management

- `GET /pantry` - Get user's pantry items
- `POST /pantry` - Add item to pantry
- `PUT /pantry/<item_id>` - Update pantry item
- `DELETE /pantry/<item_id>` - Remove item from pantry

### Recipe Discovery

- `GET /recipes/match` - Get recipe recommendations based on pantry
- `GET /recipes/<recipe_id>` - Get specific recipe details
- `GET /recipes/search` - Search recipes by ingredients

### Ingredient Scanning

- `POST /scan` - Process scanned ingredients (OCR)
- `POST /scan/barcode` - Process barcode scans

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

### Manual Docker Build

```bash
# Build the image
docker build -t pantryai-backend .

# Run the container
docker run -p 5001:5001 \
  -e GOOGLE_API_KEY=your_key \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  pantryai-backend
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_endpoints.py

# Run with coverage
python -m pytest --cov=. tests/
```

### Test Endpoints

The API includes a built-in test interface at the root endpoint (`/`) when running in development mode.

## 📁 Project Structure

```
pantryai-backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration management
├── db.py                 # Database utilities
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
├── routes/              # API route blueprints
│   ├── pantry.py        # Pantry management routes
│   ├── recipes.py       # Recipe-related routes
│   └── scan.py          # Scanning routes
├── utils/               # Utility modules
│   ├── embeddings.py    # AI embedding utilities
│   └── logger.py        # Logging configuration
├── data/                # Data files
│   ├── recipes.json     # Recipe database
│   └── recipes.index    # FAISS index for similarity search
└── tests/               # Test files
    ├── conftest.py      # Test configuration
    ├── test_endpoints.py # API endpoint tests
    └── test_parsers.py  # Parser tests
```

## 🔍 Key Features

### Recipe Matching Algorithm

The API uses a sophisticated recipe matching system that:

1. **Analyzes pantry contents** using ingredient embeddings
2. **Finds similar recipes** using FAISS similarity search
3. **Ranks recommendations** based on ingredient overlap
4. **Considers dietary preferences** and restrictions

### OCR Processing

- **Text Recognition**: Uses Tesseract OCR for ingredient scanning
- **Image Processing**: Optimizes images for better recognition
- **Ingredient Parsing**: Extracts structured data from scanned text

### Database Integration

- **Supabase**: Primary database for user data and pantry items
- **SQLite**: Local development and caching
- **FAISS**: Vector similarity search for recipe matching

## 🚀 Production Deployment

### Cloud Platforms

The backend is designed to be deployed on any cloud platform:

- **Heroku**: Use the provided Dockerfile
- **AWS ECS**: Deploy using docker-compose.yml
- **Google Cloud Run**: Use the Dockerfile
- **DigitalOcean App Platform**: Deploy directly from GitHub

### Environment Variables for Production

```env
FLASK_DEBUG=False
GOOGLE_API_KEY=your_production_key
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
```

### Performance Optimization

- **Gunicorn**: Production WSGI server with multiple workers
- **Caching**: Implement Redis for session and data caching
- **CDN**: Use CloudFlare or similar for static assets
- **Load Balancing**: Use multiple instances behind a load balancer

## 📈 Monitoring and Logging

### Logging Configuration

The API uses structured logging with different levels:
- **DEBUG**: Detailed development information
- **INFO**: General application events
- **WARNING**: Potential issues
- **ERROR**: Error conditions

### Health Checks

- **Endpoint**: `GET /health`
- **Response**: JSON with service status and version
- **Use Case**: Load balancer health checks and monitoring

## 🔒 Security

### API Security

- **CORS**: Configured for mobile app domains
- **Rate Limiting**: Implemented on sensitive endpoints
- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: Secure error responses without sensitive data

### Data Protection

- **Encryption**: Sensitive data encrypted at rest
- **Authentication**: User-based access control
- **Audit Logging**: Track API usage and changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 