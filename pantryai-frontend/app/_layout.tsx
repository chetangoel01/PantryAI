import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add global functions for testing onboarding
if (typeof global !== 'undefined') {
  (global as any).resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasOpenedApp');
      await AsyncStorage.removeItem('onboardingCompleted');
      console.log('✅ Onboarding reset successfully!');
      console.log('📱 Restart the app to see the onboarding flow');
    } catch (error) {
      console.error('❌ Failed to reset onboarding:', error);
    }
  };

  (global as any).checkOnboardingState = async () => {
    try {
      const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      console.log('📊 Current onboarding state:');
      console.log('  hasOpenedApp:', hasOpened);
      console.log('  onboardingCompleted:', onboardingCompleted);
    } catch (error) {
      console.error('❌ Failed to check state:', error);
    }
  };
}

export default function RootLayout() {
  const [hasOpened, setHasOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const value = await AsyncStorage.getItem('hasOpenedApp');
        if (value !== null) {
          setHasOpened(true);
        }
      } catch (error) {
        console.error('Failed to load from AsyncStorage', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTime();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (hasOpened) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/splash');
      }
    }
  }, [isLoading, hasOpened, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
