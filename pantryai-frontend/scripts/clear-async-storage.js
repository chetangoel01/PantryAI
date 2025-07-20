
const AsyncStorage = require('@react-native-async-storage/async-storage');

const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage cleared successfully.');
  } catch (error) {
    console.error('Failed to clear AsyncStorage', error);
  }
};

clearAsyncStorage();
