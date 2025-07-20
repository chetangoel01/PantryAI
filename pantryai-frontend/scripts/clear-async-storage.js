
const AsyncStorage = require('@react-native-async-storage/async-storage');

const clearAsyncStorage = async () => {
  try {
    console.log('🧹 Clearing AsyncStorage...');
    
    // Clear all storage
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully.');
    
    console.log('\n📱 Onboarding Flow Reset:');
    console.log('  - hasOpenedApp: cleared');
    console.log('  - onboardingCompleted: cleared');
    console.log('  - All other app data: cleared');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Restart the PantryAI app');
    console.log('2. You should see the welcome screen');
    console.log('3. Complete the onboarding flow');
    console.log('4. Test all features as a new user');
    
  } catch (error) {
    console.error('❌ Failed to clear AsyncStorage:', error);
  }
};

clearAsyncStorage();
