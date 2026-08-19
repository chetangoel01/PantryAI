# PantryAI Mobile App

React Native mobile application for smart pantry management, built with Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Run on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## 📱 App Features

### Core Functionality

- **Pantry Management**: Track ingredients with expiration dates
- **Recipe Discovery**: Get personalized recipe suggestions
- **Barcode Scanning**: Quickly add items using camera
- **Shopping Lists**: Generate smart shopping lists
- **Expiration Alerts**: Never let food go to waste

### Navigation

The app uses file-based routing with the following main screens:

- **Home** (`/`): Dashboard with quick actions
- **Pantry** (`/pantry`): Manage your ingredients
- **Recipes** (`/recipes`): Discover new recipes
- **Camera** (`/camera`): Scan ingredients and barcodes
- **Lists** (`/lists`): Shopping and todo lists

## 🔧 Configuration

### Environment Setup

The app connects to the PantryAI backend API. Make sure the backend is running and update the API configuration in `services/api.ts` if needed.

### API Configuration

Update the API base URL in `services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:5001'; // Development
// const API_BASE_URL = 'https://your-production-api.com'; // Production
```

## 🧪 Testing

### Linting
```bash
npm run lint
```

### Clear Async Storage (Development)
```bash
npm run clear-async-storage
```

## 📦 Building for Production

### iOS Build
```bash
npm run build:ios
```

### Android Build
```bash
npm run build:android
```

### Submit to App Stores
```bash
npm run submit:ios
npm run submit:android
```

## 📁 Project Structure

```
app/
├── _layout.tsx           # Root layout with navigation
├── (tabs)/              # Tab-based navigation
│   ├── _layout.tsx      # Tab layout
│   ├── home.tsx         # Home dashboard
│   ├── pantry.tsx       # Pantry management
│   ├── recipes.tsx      # Recipe discovery
│   ├── camera.tsx       # Camera/scanning
│   └── lists.tsx        # Shopping lists
├── pantry/              # Pantry-specific screens
│   ├── [itemId].tsx     # Item details
│   └── new.tsx          # Add new item
└── recipes/             # Recipe-specific screens
    └── [recipeId].tsx   # Recipe details

components/               # Reusable components
├── OptionsModal.tsx     # Modal components
├── RecipeCard.tsx       # Recipe display cards
├── SplashScreen.tsx     # Onboarding screens
└── WelcomeScreen.tsx    # Welcome flow

services/                # API and utilities
├── api.ts              # API client
├── getDeviceId.ts      # Device identification
└── logger.ts           # Logging utilities

assets/                  # Static assets
├── images/             # App images and icons
└── fonts/              # Custom fonts
```

## 🎨 UI/UX Features

### Design System

- **Colors**: Consistent color palette with light/dark mode support
- **Typography**: Custom fonts and text styles
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and micro-interactions

### Onboarding Flow

The app includes a comprehensive onboarding experience:
- Welcome screen with app branding
- Feature introduction slides
- Smooth animated transitions
- Skip functionality for returning users

## 🔒 Security & Privacy

### Data Protection

- **Local Storage**: Sensitive data stored securely using AsyncStorage
- **API Security**: All API calls use HTTPS
- **User Privacy**: Minimal data collection, user-controlled sharing

### Permissions

The app requests the following permissions:
- **Camera**: For scanning ingredients and barcodes
- **Storage**: For saving images and data locally

## 🚀 Performance Optimization

### Best Practices

- **Lazy Loading**: Components and screens load on demand
- **Image Optimization**: Compressed images and lazy loading
- **Memory Management**: Proper cleanup of resources
- **Caching**: API responses cached for better performance

### Bundle Optimization

- **Tree Shaking**: Unused code removed from production builds
- **Code Splitting**: Separate bundles for different app sections
- **Asset Optimization**: Images and fonts optimized for mobile

## 🐛 Debugging

### Development Tools

- **Expo DevTools**: Built-in debugging and inspection
- **React Native Debugger**: Advanced debugging capabilities
- **Flipper**: Plugin-based debugging platform

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS build errors**: Clean build folder and reinstall pods
3. **Android build errors**: Clean gradle cache and rebuild

## 📈 Analytics & Monitoring

### Error Tracking

- **Crash Reporting**: Automatic crash detection and reporting
- **Performance Monitoring**: Track app performance metrics
- **User Analytics**: Anonymous usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Expo and React Native**
