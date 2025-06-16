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
  Modal,
  TextInput,
  ScrollView,
  Platform,
}
 from 'react-native';
import { useRouter } from 'expo-router';
import { scanApi, pantryApi } from '../services/api';
import TextRecognition from 'react-native-text-recognition';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

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
  // Add new state for item review modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'expiry' | 'purchase'>('expiry');

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

  const handleConfirmItems = async () => {
    try {
      setIsLoading(true);
      
      // Remove any items that might have been skipped (they would have been filtered out)
      const itemsToAdd = scannedItems
        .filter(item => item.name && item.name.trim() !== '')
        .map(item => {
          // Preserve all LLM-processed fields, only add defaults for missing required fields
          return {
            name: item.name,
            category: item.category || 'Uncategorized',
            quantity: parseInt(String(item.quantity)) || 1, // Keep original logic for adding to pantry, as 0 qty might not be desirable there
            unit: item.unit || '',
            expiry: item.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
            location: item.location || 'Pantry',
            brand: item.brand || '',
            barcode: item.barcode || '',
            notes: item.notes || '',
            is_opened: Boolean(item.is_opened),
            added_at: new Date().toISOString()
          };
        });
      
      if (itemsToAdd.length === 0) {
        Alert.alert('No Items', 'No items to add to pantry.');
        return;
      }

      const response = await pantryApi.confirmAddItems(itemsToAdd);
      
      if (response.inserted) {
        Alert.alert(
          'Success',
          `Successfully added ${response.inserted.length} items to your pantry!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowItemModal(false);
                router.push('/pantry');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error adding items to pantry:', error);
      if (error.response) {
        console.error('API error response:', error.response.data);
        console.error('API error status:', error.response.status);
        console.error('API error headers:', error.response.headers);
      }
      Alert.alert(
        'Error',
        `Failed to add items to pantry: ${error.response?.data?.error || error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < scannedItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      handleConfirmItems();
    }
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleSkipItem = () => {
    const updatedItems = scannedItems.filter((_, index) => index !== currentItemIndex);
    setScannedItems(updatedItems);
    if (currentItemIndex >= updatedItems.length) {
      setCurrentItemIndex(Math.max(0, updatedItems.length - 1));
    }
    if (updatedItems.length === 0) {
      console.log('No items remaining, closing modal');
      setShowItemModal(false);
    }
  };

  // Modify snapPhoto function
  const snapPhoto = async () => {
    if (!cameraRef.current) return;
    try {
      console.log('Starting photo capture...');
      setIsLoading(true);
  
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
      });
      console.log('Photo captured successfully:', photo.uri);
      
      const recognizedText = await TextRecognition.recognize(photo.uri);
      console.log('OCR Results:', recognizedText);
  
      const parsedLines = recognizedText
        .map((line) => line.toLowerCase())
        .filter((line) => line.length > 1);
      console.log('Filtered OCR lines:', parsedLines);
  
      const response = await scanApi.scanImage(parsedLines);
      console.log('Scan API response:', JSON.stringify(response, null, 2));
      
      if (response.parsed_items.length === 0) {
        console.log('No items detected in scan response');
        Alert.alert('No Items Found', 'No items were detected in the image. Please try again.');
        return;
      }

      // Use the LLM-processed items directly from the API response
      const llmProcessedItems = response.parsed_items.map(item => {
        const parsedQuantity = parseInt(String(item.quantity));
        // Use parsedQuantity if it's a number (including 0), otherwise default to 1.
        const quantityToUse = isNaN(parsedQuantity) ? 1 : parsedQuantity;

        return {
          name: item.name,
          category: item.category || 'Uncategorized',
          quantity: quantityToUse, // Use the refined quantity
          unit: item.unit || '',
          expiry: item.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
          location: item.location || 'Pantry',
          brand: item.brand || '',
          barcode: item.barcode || '',
          notes: item.notes || '',
          is_opened: Boolean(item.is_opened),
          added_at: new Date().toISOString()
        };
      });

      console.log('LLM processed items for modal:', JSON.stringify(llmProcessedItems, null, 2));
      setScannedItems(llmProcessedItems);
      setCurrentItemIndex(0);
      setShowItemModal(true);
  
    } catch (err: any) {
      console.error('OCR processing error:', err);
      if (err.response) {
        console.error('API error response:', err.response.data);
      }
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updatedItems = [...scannedItems];
      const currentItem = updatedItems[currentItemIndex];
      if (datePickerMode === 'expiry') {
        currentItem.expiry = selectedDate.toISOString().split('T')[0];
      } else {
        currentItem.purchase_date = selectedDate.toISOString().split('T')[0];
      }
      setScannedItems(updatedItems);
    }
  };

  const showDatePickerModal = (mode: 'expiry' | 'purchase') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const renderItemModal = () => {
    if (!showItemModal || scannedItems.length === 0) return null;
    
    const currentItem = scannedItems[currentItemIndex];
    const isLastItem = currentItemIndex === scannedItems.length - 1;
    const isFirstItem = currentItemIndex === 0;

    const updateItemField = (field: string, value: string) => {
      const updatedItems = [...scannedItems];
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        [field]: value
      };
      setScannedItems(updatedItems);
    };

    return (
      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Review Item {currentItemIndex + 1} of {scannedItems.length}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowItemModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              <View style={styles.itemDetails}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.name ?? ''} // Ensure string value
                    onChangeText={(value) => updateItemField('name', value)}
                    placeholder="Item name"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={String(currentItem.quantity ?? '')} // Ensure string value
                      onChangeText={(value) => updateItemField('quantity', value)}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      value={currentItem.unit ?? ''} // Ensure string value
                      onChangeText={(value) => updateItemField('unit', value)}
                      placeholder="unit"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.category ?? ''} // Ensure string value
                    onChangeText={(value) => updateItemField('category', value)}
                    placeholder="Category"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => showDatePickerModal('expiry')}
                    >
                      <Text style={styles.dateText}>
                        {currentItem.expiry ?? 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Purchase Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => showDatePickerModal('purchase')}
                    >
                      <Text style={styles.dateText}>
                        {currentItem.purchase_date ?? 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.location ?? ''} // Ensure string value
                    onChangeText={(value) => updateItemField('location', value)}
                    placeholder="Pantry"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.brand ?? ''} // Ensure string value
                    onChangeText={(value) => updateItemField('brand', value)}
                    placeholder="Brand (optional)"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={currentItem.notes ?? ''} // Ensure string value
                    onChangeText={(value) => updateItemField('notes', value)}
                    placeholder="Add any notes (optional)"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.skipButton]}
                onPress={handleSkipItem}
              >
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>

              {!isFirstItem && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.previousButton]}
                  onPress={handlePreviousItem}
                >
                  <Text style={styles.buttonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.modalButton, styles.nextButton]}
                onPress={handleNextItem}
              >
                <Text style={styles.buttonText}>
                  {isLastItem ? 'Add All Items' : 'Next Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(currentItem[datePickerMode] ? currentItem[datePickerMode] : Date.now())}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </Modal>
    );
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
      {renderItemModal()}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    paddingRight: 23,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    maxHeight: '70%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemDetails: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    flex: 1,
  },
  skipButton: {
    backgroundColor: '#ff6b6b',
  },
  previousButton: {
    backgroundColor: '#666',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});