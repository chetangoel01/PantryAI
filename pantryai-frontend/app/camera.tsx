// src/screens/CameraScreen.tsx
import React, { useState, useRef } from 'react';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from 'expo-camera';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { scanApi } from '../services/api';
import TextRecognition from 'react-native-text-recognition';

import * as FileSystem from 'expo-file-system'; // needed to handle paths properly


export default function CameraScreen() {
  const router = useRouter();
  // camera facing state
  const [facing, setFacing] = useState<CameraType>('back');
  // permission hook
  const [permission, requestPermission] = useCameraPermissions();
  // ref to the CameraView instance
  const cameraRef = useRef<CameraView>(null);
  // loading state
  const [isLoading, setIsLoading] = useState(false);

  // while permissions are loading
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // if not yet granted, ask
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to access the camera.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // toggle front/back
  const toggleCameraFacing = () => {
    console.log('Toggling camera facing');
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // take a picture and process it
  const snapPhoto = async () => {
    if (!cameraRef.current) return;
    // adding a check for whether text recognition is working
    try {
      console.log('Starting photo capture...');
      setIsLoading(true);
  
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true, // helps performance
      });
      console.log('Photo captured:', photo.uri);

      console.log('TextRecognition:1', TextRecognition);

      TextRecognition.recognize(photo.uri)
    .then(result => console.log('OCR result:', result))
    .catch(err    => console.error('OCR error2:', err));


      // OCR processing using on-device
      const recognizedText = await TextRecognition.recognize(photo.uri);
      console.log('Recognized text:', recognizedText);
  
      // Extract ingredients from text
      const parsedItems = recognizedText
        .map((line) => line.toLowerCase())
        .filter((line) => line.length > 1); // Filter short garbage lines
  
      // Send parsed items to backend
      const response = await scanApi.scanImage(parsedItems);
      
      // Navigate with parsed items
      router.push({
        pathname: '/pantry',
        params: { scannedItems: JSON.stringify(response.parsed_items) },
      });
  
    } catch (err: any) {
      console.error('OCR processing error:', err);
      Alert.alert(
        'Error',
        `Failed to extract text from image: ${err.message || err}`,
        [{ text: 'OK' }]
      );
    } finally {
      console.log('snapPhoto finished');
      setIsLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={facing}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.button}
            onPress={toggleCameraFacing}
            disabled={isLoading}
          >
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={snapPhoto}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.text}>Snap</Text>
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', padding: 20, color: '#fff' },
  permissionButton: {
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionText: { color: '#fff', fontWeight: 'bold' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    borderRadius: 50,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: { fontSize: 16, fontWeight: '600', color: '#000' },
});
