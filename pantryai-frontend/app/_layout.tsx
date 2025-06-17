import React from 'react';
import { Stack, Redirect } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Redirect href="/(tabs)/home" />
    </>
  );
}
