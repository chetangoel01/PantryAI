import { View } from 'react-native';
import React from 'react';

export type RootTabParamList = {
  home: undefined;
  recipes: undefined;
  pantry: undefined;
  lists: undefined;
  camera: undefined;
}; 

// Default export for Expo Router
const Types: React.FC = () => {
  return <View />;
};

export default Types; 