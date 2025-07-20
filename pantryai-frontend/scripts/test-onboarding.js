const AsyncStorage = require('@react-native-async-storage/async-storage');

// Utility script to test onboarding flow
// This can be run in the React Native debugger or as a standalone script

const clearOnboardingState = async () => {
  try {
    await AsyncStorage.removeItem('hasOpenedApp');
    await AsyncStorage.removeItem('onboardingCompleted');
    console.log('✅ Onboarding state cleared successfully');
    console.log('📱 Restart the app to see the onboarding flow again');
  } catch (error) {
    console.error('❌ Failed to clear onboarding state:', error);
  }
};

const checkOnboardingState = async () => {
  try {
    const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
    const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    
    console.log('📊 Current onboarding state:');
    console.log('  hasOpenedApp:', hasOpened);
    console.log('  onboardingCompleted:', onboardingCompleted);
    
    if (hasOpened === 'true') {
      console.log('✅ User has opened the app before');
    } else {
      console.log('🆕 User is a first-time user');
    }
  } catch (error) {
    console.error('❌ Failed to check onboarding state:', error);
  }
};

// Export functions for use in React Native debugger
if (typeof global !== 'undefined') {
  global.clearOnboardingState = clearOnboardingState;
  global.checkOnboardingState = checkOnboardingState;
}

module.exports = {
  clearOnboardingState,
  checkOnboardingState
}; 