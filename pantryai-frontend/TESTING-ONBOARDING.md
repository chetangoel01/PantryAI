# Testing PantryAI Onboarding Flow

## 🚀 Quick Start Testing

### Method 1: Using React Native Debugger (Recommended)

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Open React Native Debugger** and run these commands:
   ```javascript
   // Check current state
   const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
   console.log('hasOpened:', hasOpened);

   // Clear onboarding state to test as first-time user
   await AsyncStorage.removeItem('hasOpenedApp');
   await AsyncStorage.removeItem('onboardingCompleted');
   console.log('✅ Onboarding state cleared - restart app');
   ```

3. **Restart the app** and test the onboarding flow

### Method 2: Manual Testing (No Debugger)

1. **First time testing**: Just start the app - it should show onboarding
2. **Reset for testing**: Use the "Skip" button or complete onboarding, then restart app
3. **Test again**: The app will remember you've completed onboarding

## 🎯 What to Test

### 1. Welcome Screen (Green Background)
- ✅ **Logo Animation**: Restaurant icon scales from 0.3 to 1.0
- ✅ **Text Sequence**: Title → Subtitle → Description appear in order
- ✅ **Button**: "Begin Your Journey" is clickable and responsive
- ✅ **Styling**: Professional green gradient with shadows

### 2. Onboarding Slides (White Background)
- ✅ **Slide 1**: "Welcome to PantryAI" (Green restaurant icon)
- ✅ **Slide 2**: "Scan Your Pantry" (Blue camera icon)
- ✅ **Slide 3**: "Discover Recipes" (Orange book icon)
- ✅ **Slide 4**: "Smart Shopping" (Purple cart icon)

### 3. Navigation Features
- ✅ **Skip Button**: Top-right corner, bypasses all slides
- ✅ **Next Button**: Navigates through slides with animations
- ✅ **Dot Indicators**: Show current position, active dot is wider
- ✅ **Get Started**: Appears on last slide, completes onboarding

### 4. Animations & Transitions
- ✅ **Slide Transitions**: Smooth fade out/in with translateY
- ✅ **Dot Updates**: Dynamic width changes for active state
- ✅ **Button States**: Smooth transitions between Next/Get Started
- ✅ **Performance**: No stuttering, uses native driver

## 🔧 Testing Commands

### In React Native Debugger Console:
```javascript
// Check onboarding state
const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
console.log('State:', { hasOpened, onboardingCompleted });

// Clear to test as new user
await AsyncStorage.removeItem('hasOpenedApp');
await AsyncStorage.removeItem('onboardingCompleted');
console.log('✅ Cleared - restart app to see onboarding');

// Set as returning user
await AsyncStorage.setItem('hasOpenedApp', 'true');
await AsyncStorage.setItem('onboardingCompleted', 'true');
console.log('✅ Set as returning user - restart app to skip onboarding');
```

## 📱 Expected User Flows

### First-Time User
1. App starts → Welcome screen (green)
2. Tap "Begin Your Journey" → Onboarding slides
3. Navigate through 4 slides or tap "Skip"
4. Tap "Get Started" → Home screen
5. Restart app → Goes directly to home

### Returning User
1. App starts → Home screen (skips onboarding)
2. No welcome or onboarding screens shown

### Skip Flow
1. Welcome screen → Tap "Skip" → Home screen
2. Or any slide → Tap "Skip" → Home screen

## 🐛 Troubleshooting

### Onboarding Doesn't Show
```javascript
// In debugger console
await AsyncStorage.removeItem('hasOpenedApp');
await AsyncStorage.removeItem('onboardingCompleted');
// Restart app
```

### Animations Not Working
- Check console for errors
- Verify `useNativeDriver: true` in animations
- Test on different devices

### Buttons Not Responsive
- Check TouchableOpacity implementation
- Verify no overlapping elements
- Test touch targets are large enough

### App Crashes
- Check TypeScript compilation: `npx tsc --noEmit`
- Verify all imports are correct
- Check React Native version compatibility

## ✅ Success Criteria

- [ ] First-time users see welcome screen with animations
- [ ] Onboarding slides are informative and visually appealing
- [ ] Skip functionality works from any point
- [ ] App remembers user state after completion
- [ ] Animations are smooth and professional
- [ ] No crashes or errors during flow
- [ ] Works consistently on iOS and Android
- [ ] Performance is good (no lag or stuttering)

## 🎨 Design Notes

- **Welcome Screen**: Green gradient (#4CAF50) with white text
- **Onboarding**: White background with colored icons
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins throughout
- **Shadows**: Subtle shadows for depth and professionalism

## 📊 Performance Metrics

- **Welcome Animation**: ~2.5 seconds total
- **Slide Transitions**: ~500ms each
- **Memory Usage**: Minimal (no heavy assets)
- **Battery Impact**: Low (optimized animations)
- **Load Time**: Fast (no network requests)

## 🔄 Testing Cycle

1. **Clear state** → Test as first-time user
2. **Complete onboarding** → Test as returning user
3. **Test skip functionality** → Verify bypass works
4. **Test edge cases** → Rapid tapping, different screen sizes
5. **Performance test** → Check for memory leaks or lag 