// app/index.tsx
import React from 'react';
import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  // Only fires when the path is exactly “/”
  return <Redirect href="/(tabs)/home" />;
}
