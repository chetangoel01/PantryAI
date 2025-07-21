#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 PantryAI App Store Screenshots Guide\n');

const screenshotSpecs = {
  'iPhone 15 Pro Max (6.7")': {
    width: 1290,
    height: 2796,
    filename: 'iphone-15-pro-max-6.7-inch.png'
  },
  'iPhone 11 Pro Max (6.5")': {
    width: 1242,
    height: 2688,
    filename: 'iphone-11-pro-max-6.5-inch.png'
  },
  'iPhone 8 Plus (5.5")': {
    width: 1242,
    height: 2208,
    filename: 'iphone-8-plus-5.5-inch.png'
  },
  'iPad Pro 12.9"': {
    width: 2048,
    height: 2732,
    filename: 'ipad-pro-12.9-inch.png'
  }
};

console.log('📋 Required Screenshots:\n');

Object.entries(screenshotSpecs).forEach(([device, specs]) => {
  console.log(`${device}:`);
  console.log(`  Dimensions: ${specs.width}x${specs.height}px`);
  console.log(`  Filename: ${specs.filename}`);
  console.log('');
});

console.log('🎯 Screenshot Content Requirements:\n');

const requiredScreenshots = [
  {
    device: 'iPhone 15 Pro Max',
    screenshots: [
      'Home screen with pantry items list',
      'Camera scanning interface with OCR',
      'Recipe recommendations screen',
      'Shopping list view',
      'Item details with expiration tracking'
    ]
  },
  {
    device: 'iPhone 11 Pro Max',
    screenshots: [
      'Pantry item details screen',
      'Recipe detail view with ingredients',
      'Settings and preferences screen',
      'Add new item interface'
    ]
  },
  {
    device: 'iPhone 8 Plus',
    screenshots: [
      'Categories and organization view',
      'Search and filter functionality',
      'Quick add item screen'
    ]
  }
];

requiredScreenshots.forEach(device => {
  console.log(`${device.device}:`);
  device.screenshots.forEach((screenshot, index) => {
    console.log(`  ${index + 1}. ${screenshot}`);
  });
  console.log('');
});

console.log('📝 Screenshot Guidelines:\n');
console.log('✅ Use high-quality, clear images');
console.log('✅ Show the app in use with realistic data');
console.log('✅ Highlight key features like OCR scanning');
console.log('✅ Include dark mode screenshots if available');
console.log('✅ Ensure text is readable and UI elements are clear');
console.log('✅ Avoid showing personal information or sensitive data');
console.log('✅ Use consistent styling and branding');

console.log('\n🛠️ Tools for Creating Screenshots:\n');
console.log('• Simulator: Use Xcode Simulator to capture screenshots');
console.log('• Device: Take screenshots on actual devices');
console.log('• Design Tools: Figma, Sketch, or Photoshop for mockups');
console.log('• Online Tools: AppMockUp, Screenshot Maker');

console.log('\n📁 File Organization:\n');
console.log('Create a folder structure like this:');
console.log('screenshots/');
console.log('├── iphone-15-pro-max/');
console.log('│   ├── home-screen.png');
console.log('│   ├── camera-scan.png');
console.log('│   ├── recipes.png');
console.log('│   └── shopping-list.png');
console.log('├── iphone-11-pro-max/');
console.log('│   └── ...');
console.log('└── iphone-8-plus/');
console.log('    └── ...');

console.log('\n🚀 Next Steps:');
console.log('1. Take screenshots using the simulator or device');
console.log('2. Edit and optimize images for App Store');
console.log('3. Upload to App Store Connect');
console.log('4. Test on different devices to ensure quality'); 