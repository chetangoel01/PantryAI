# PantryAI - App Store Connect Setup Guide

## Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- EAS CLI installed and configured

## Step 1: App Store Connect Setup

### 1.1 Create New App
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in the details:
   - **Platforms**: iOS
   - **Name**: Pantry
   - **Primary Language**: English (US)
   - **Bundle ID**: com.dragonchetan.pantryai
   - **SKU**: pantryai-ios-2024
   - **User Access**: Full Access

### 1.2 App Information
1. **App Information** tab:
   - **Category**: Food & Drink
   - **Subcategory**: Recipe & Meal Planning
   - **Content Rights**: Check "You own or have licensed all rights to your app"

2. **Pricing and Availability**:
   - **Price**: Free
   - **Availability**: All Countries
   - **Age Rating**: 4+

## Step 2: App Review Information

### 2.1 Contact Information
- **First Name**: Chetan
- **Last Name**: Dragon
- **Phone**: [Your Phone Number]
- **Email**: privacy@pantryai.dragonchetan.com
- **Support Email**: support@pantryai.dragonchetan.com

### 2.2 Demo Account
- **Username**: demo@pantryai.com
- **Password**: demo123
- **Notes**: Use this account to test all features including OCR scanning functionality

## Step 3: App Store Listing

### 3.1 App Store Information
- **Name**: Pantry
- **Subtitle**: Smart pantry management with AI
- **Keywords**: pantry,grocery,shopping,recipe,meal,planning,food,inventory,kitchen,cooking,ingredients,scan,ocr,ai
- **Description**: [Use the description from app-store-metadata.md]

### 3.2 Screenshots
Upload screenshots for each device size:
- **6.7" iPhone 15 Pro Max**: 4-5 screenshots
- **6.5" iPhone 11 Pro Max**: 4-5 screenshots  
- **5.5" iPhone 8 Plus**: 4-5 screenshots

### 3.3 App Preview Video (Optional)
- Create a 15-30 second video showcasing key features
- Focus on OCR scanning and recipe recommendations

## Step 4: Build and Submit

### 4.1 Build Configuration
Update `eas.json` with your Apple credentials:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### 4.2 Build Commands
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for production
npm run build:ios

# Submit to App Store
npm run submit:ios
```

## Step 5: App Review Process

### 5.1 Before Submitting
- [ ] Test all features thoroughly
- [ ] Ensure OCR scanning works properly
- [ ] Verify privacy policy is accessible
- [ ] Check all screenshots are high quality
- [ ] Test on multiple devices

### 5.2 Common Rejection Reasons
- **Privacy Policy**: Must be accessible and comprehensive
- **App Functionality**: All features must work as described
- **Screenshots**: Must accurately represent the app
- **Metadata**: Keywords and description must be accurate

### 5.3 Review Timeline
- **Initial Review**: 1-3 days
- **Re-review** (if rejected): 1-2 days
- **Final Approval**: 1-2 days

## Step 6: Post-Launch

### 6.1 Monitor
- App Store Analytics
- User reviews and ratings
- Crash reports
- Performance metrics

### 6.2 Updates
- Regular bug fixes and improvements
- Feature updates
- iOS compatibility updates

## Troubleshooting

### Common Issues
1. **Build Failures**: Check EAS build logs
2. **Rejection**: Address specific feedback from Apple
3. **Metadata Issues**: Ensure all required fields are filled

### Support Resources
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Documentation](https://docs.expo.dev/eas/)

## Checklist

### Pre-Submission
- [ ] App builds successfully
- [ ] All features tested
- [ ] Privacy policy created and accessible
- [ ] Screenshots prepared for all device sizes
- [ ] App metadata complete
- [ ] Demo account configured
- [ ] Contact information provided

### Post-Submission
- [ ] Monitor review status
- [ ] Respond to any feedback
- [ ] Prepare for launch
- [ ] Set up analytics and monitoring

## Contact Information
- **Developer**: Chetan Dragon
- **Email**: privacy@pantryai.dragonchetan.com
- **Website**: https://pantryai.dragonchetan.com
- **Support**: https://pantryai.dragonchetan.com/support
- **Privacy Policy**: https://pantryai.dragonchetan.com/privacy 