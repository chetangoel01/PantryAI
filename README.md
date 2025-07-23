# PantryAI 🥘

A smart pantry management app that helps you organize your kitchen, discover recipes based on your ingredients, and never waste food again.

## 🌟 Features

- **Smart Pantry Management**: Track your ingredients with expiration dates
- **Recipe Discovery**: Get personalized recipe suggestions based on your pantry
- **Barcode Scanning**: Quickly add items using your camera
- **Shopping Lists**: Generate smart shopping lists based on your needs
- **Expiration Alerts**: Never let food go to waste again
- **Cross-Platform**: Available on iOS and Android

## 📱 Download

- **iOS App Store**: [PantryAI on App Store](https://apps.apple.com/app/pantryai/id1234567890) *(Coming Soon)*
- **Google Play Store**: [PantryAI on Google Play](https://play.google.com/store/apps/details?id=com.dragonchetan.pantryai) *(Coming Soon)*

> **Note**: The app is currently in development. Follow our GitHub repository for updates on the release.

## 🏗️ Project Structure

```
PantryAI/
├── pantryai-frontend/     # React Native/Expo mobile app
├── pantryai-backend/      # Flask API server
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Frontend Setup (Mobile App)

1. **Navigate to the frontend directory**:
   ```bash
   cd pantryai-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

### Backend Setup (API Server)

1. **Navigate to the backend directory**:
   ```bash
   cd pantryai-backend
   ```

2. **Create a virtual environment**:
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
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

5. **Run the development server**:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5001`

## 🐳 Docker Deployment

### Backend with Docker

1. **Build and run with Docker Compose**:
   ```bash
   cd pantryai-backend
   docker-compose up --build
   ```

2. **Or build manually**:
   ```bash
   docker build -t pantryai-backend .
   docker run -p 5001:5001 pantryai-backend
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
FLASK_DEBUG=True
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### API Keys Required

- **Google AI API**: For recipe matching and ingredient recognition
- **Supabase**: For database and authentication

## 📊 API Endpoints

The backend provides the following main endpoints:

- `GET /` - API documentation and health check
- `GET /pantry` - Get user's pantry items
- `POST /pantry` - Add item to pantry
- `GET /recipes/match` - Get recipe recommendations
- `POST /scan` - Process scanned ingredients

## 🧪 Testing

### Frontend Testing
```bash
cd pantryai-frontend
npm run lint
```

### Backend Testing
```bash
cd pantryai-backend
python -m pytest tests/
```

## 📦 Building for Production

### Mobile App

1. **Build for iOS**:
   ```bash
   cd pantryai-frontend
   npm run build:ios
   ```

2. **Build for Android**:
   ```bash
   cd pantryai-frontend
   npm run build:android
   ```

3. **Submit to App Stores**:
   ```bash
   npm run submit:ios
   npm run submit:android
   ```

### Backend Deployment

The backend is designed to be deployed on any cloud platform that supports Docker:

- **Heroku**: Use the provided Dockerfile
- **AWS ECS**: Deploy using the docker-compose.yml
- **Google Cloud Run**: Use the Dockerfile
- **DigitalOcean App Platform**: Deploy directly from GitHub

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the API docs at the root endpoint
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@pantryai.com

## 🚧 Current Status

### Development Phase
- ✅ **Backend API**: Complete with recipe matching and pantry management
- ✅ **Mobile App**: Core functionality implemented with React Native/Expo
- ✅ **AI Integration**: Google AI for recipe recommendations
- 🔄 **Testing**: Comprehensive test suite in progress
- 🔄 **App Store Submission**: Preparing for review process

### Roadmap
- **Q1 2024**: Beta testing and bug fixes
- **Q2 2024**: App Store submission and public release
- **Q3 2024**: Advanced features and performance optimization
- **Q4 2024**: Community features and integrations

## 🏆 Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Backend powered by [Flask](https://flask.palletsprojects.com/)
- AI features powered by [Google AI](https://ai.google.dev/)
- Database hosted on [Supabase](https://supabase.com/)

---

**Made with ❤️ by the PantryAI team** 