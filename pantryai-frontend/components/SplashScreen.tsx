
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  Animated,
  Image,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import WelcomeScreen from './WelcomeScreen';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to PantryAI',
    description: 'Your smart kitchen assistant that helps you make the most of your ingredients',
    icon: 'restaurant-outline',
    color: '#4CAF50'
  },
  {
    id: 2,
    title: 'Scan Your Pantry',
    description: 'Take photos of your receipts and let AI identify them automatically',
    icon: 'camera-outline',
    color: '#2196F3'
  },
  {
    id: 3,
    title: 'Discover Recipes',
    description: 'Get personalized recipe suggestions based on what you have',
    icon: 'book-outline',
    color: '#FF9800'
  },
  {
    id: 4,
    title: 'Smart Shopping',
    description: 'Keep track of your shopping lists and never run out of essentials',
    icon: 'cart-outline',
    color: '#9C27B0'
  }
];

const SplashScreen = () => {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        scrollViewRef.current?.scrollTo({
          x: (currentIndex + 1) * width,
          animated: false,
        });
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      });
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasOpenedApp', 'true');
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Failed to save to AsyncStorage', error);
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasOpenedApp', 'true');
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Failed to save to AsyncStorage', error);
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <Animated.View 
        style={[
          styles.slideContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
          <Ionicons name={slide.icon as any} size={60} color="#fff" />
        </View>
        
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </Animated.View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingSlides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? '#4CAF50' : '#D0D0D0',
              width: index === currentIndex ? 20 : 8,
            }
          ]}
        />
      ))}
    </View>
  );

  // Show welcome screen first
  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleWelcomeComplete} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        scrollEnabled={false}
      >
        {onboardingSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Dots Indicator */}
      {renderDots()}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentIndex < onboardingSlides.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  slideDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default SplashScreen;
