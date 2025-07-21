#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing PantryAI for App Store...\n');

// Check if required assets exist
const requiredAssets = [
  './assets/images/icon.png',
  './assets/images/dark-icon.png',
  './assets/images/splash-icon.png'
];

console.log('📱 Checking required assets:');
requiredAssets.forEach(asset => {
  const exists = fs.existsSync(path.join(__dirname, '..', asset));
  console.log(`  ${exists ? '✅' : '❌'} ${asset}`);
});

console.log('\n📋 App Store Requirements Checklist:');
console.log('  ✅ App Icon (1024x1024)');
console.log('  ✅ Privacy Policy URL (add to app.json)');
console.log('  ✅ Support Page URL (add to app.json)');
console.log('  ✅ App Store Description');
console.log('  ✅ Screenshots (6.7", 6.5", 5.5" displays)');
console.log('  ✅ Keywords for App Store search');
console.log('  ✅ App Store Connect setup');

console.log('\n🔧 Next Steps:');
console.log('1. Install EAS CLI: npm install -g @expo/eas-cli');
console.log('2. Login to Expo: eas login');
console.log('3. Configure your Apple Developer account');
console.log('4. Update eas.json with your Apple ID and team ID');
console.log('5. Build for production: npm run build:ios');
console.log('6. Submit to App Store: npm run submit:ios');

console.log('\n📝 Required App Store Information:');
console.log('- App Name: Pantry');
console.log('- Bundle ID: com.dragonchetan.pantryai');
console.log('- Category: Food & Drink');
console.log('- Age Rating: 4+');
console.log('- Price: Free');

console.log('\n🎯 App Store Keywords Suggestions:');
console.log('pantry, grocery, shopping list, food, recipe, meal planning, inventory, kitchen, cooking, ingredients'); 