import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
