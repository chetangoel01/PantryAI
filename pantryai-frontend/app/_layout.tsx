// app/_layout.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import your screens from their new locations
import HomeScreen from './home';
import RecipesScreen from './recipes';
import PantryScreen from './pantry';
import ListsScreen from './lists';
import CameraScreen from './camera';
import RecipeDetailScreen from './recipes/[recipeId]';

// Define Root Stack Param List for the Recipes stack
type RecipesStackParamList = {
  recipesMain: undefined;
  recipeDetail: { recipeId: string };
};

// Define Root Tab Param List for your bottom tabs
export type RootTabParamList = {
  home: undefined;
  recipes: undefined;
  pantry: undefined;
  lists: undefined;
  camera: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RecipesStackParamList>();

// This is your "Recipes" tab's content, which is a stack navigator
const RecipesStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="recipesMain" component={RecipesScreen} />
      <Stack.Screen name="recipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
};

// This is your root layout, which defines the bottom tabs
export default function RootLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'recipes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'pantry') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'lists') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="home" 
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="recipes" 
        component={RecipesStack}
        options={{
          title: 'Recipes',
        }}
      />
      <Tab.Screen 
        name="pantry" 
        component={PantryScreen}
        options={{
          title: 'Pantry',
        }}
      />
      <Tab.Screen 
        name="lists" 
        component={ListsScreen}
        options={{
          title: 'Lists',
        }}
      />
      <Tab.Screen 
        name="camera" 
        component={CameraScreen}
        options={{
          title: 'Camera',
        }}
      />
    </Tab.Navigator>
  );
}