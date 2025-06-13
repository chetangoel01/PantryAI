// src/screens/CameraScreen.tsx
import React, { useState, useRef } from 'react';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  TakePictureOptions,
} from 'expo-camera';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function CameraScreen() {
  // camera facing state
  const [facing, setFacing] = useState<CameraType>('back');
  // permission hook
  const [permission, requestPermission] = useCameraPermissions();
  // ref to the CameraView instance
  const cameraRef = useRef<CameraView>(null);

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
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // example: take a picture and log the URI
  const snapPhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync(
        {} as TakePictureOptions
      );
      console.log('📸 Photo URI:', photo.uri);
      // TODO: handle photo.uri (upload, display preview, etc.)
    } catch (err) {
      console.error('Failed to snap photo', err);
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
          >
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={snapPhoto}
          >
            <Text style={styles.text}>Snap</Text>
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
  text: { fontSize: 16, fontWeight: '600', color: '#000' },
});
