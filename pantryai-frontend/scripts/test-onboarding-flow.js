#!/usr/bin/env node

const AsyncStorage = require('@react-native-async-storage/async-storage');

console.log('🧪 PantryAI Onboarding Flow Test Script');
console.log('=====================================\n');

async function testOnboardingFlow() {
  try {
    console.log('📊 Checking current onboarding state...');
    
    const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
    const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    
    console.log(`  hasOpenedApp: ${hasOpened}`);
    console.log(`  onboardingCompleted: ${onboardingCompleted}\n`);
    
    if (hasOpened === 'true') {
      console.log('✅ User has completed onboarding');
      console.log('🔄 To test onboarding again, clearing state...\n');
      
      await AsyncStorage.removeItem('hasOpenedApp');
      await AsyncStorage.removeItem('onboardingCompleted');
      
      console.log('🗑️  Onboarding state cleared!');
      console.log('📱 Restart the app to see the onboarding flow again\n');
    } else {
      console.log('🆕 User is a first-time user');
      console.log('📱 The onboarding flow will show when the app starts\n');
    }
    
    console.log('🎯 Test Instructions:');
    console.log('1. Start the PantryAI app');
    console.log('2. You should see the welcome screen with animations');
    console.log('3. Tap "Begin Your Journey" to proceed to onboarding slides');
    console.log('4. Navigate through the 4 slides using "Next" button');
    console.log('5. Test the "Skip" button functionality');
    console.log('6. Complete onboarding with "Get Started" button');
    console.log('7. Verify you land on the home screen');
    console.log('8. Restart app to confirm it skips onboarding\n');
    
    console.log('🔧 To reset and test again, run this script again');
    
  } catch (error) {
    console.error('❌ Error testing onboarding flow:', error);
  }
}

// Run the test
testOnboardingFlow(); 