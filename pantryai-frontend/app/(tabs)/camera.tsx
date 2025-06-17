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
import { scanApi, pantryApi } from '../../services/api';
import TextRecognition from 'react-native-text-recognition';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
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
  
  // DatePicker state
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
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
      
      const itemsToAdd = scannedItems
        .filter(item => item.name && item.name.trim() !== '')
        .map(item => {
          return {
            name: item.name,
            category: item.category || 'Uncategorized',
            quantity: parseInt(String(item.quantity)) || 1,
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
      setShowItemModal(false);
    }
  };

  const snapPhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsLoading(true);
  
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
      });
      
      const recognizedText = await TextRecognition.recognize(photo.uri);
  
      const parsedLines = recognizedText
        .map((line) => line.toLowerCase())
        .filter((line) => line.length > 1);
  
      const response = await scanApi.scanImage(parsedLines);
      
      if (response.parsed_items.length === 0) {
        Alert.alert('No Items Found', 'No items were detected in the image. Please try again.');
        return;
      }

      const llmProcessedItems = response.parsed_items.map(item => {
        const parsedQuantity = parseInt(String(item.quantity));
        const quantityToUse = isNaN(parsedQuantity) ? 1 : parsedQuantity;

        return {
          name: item.name,
          category: item.category || 'Uncategorized',
          quantity: quantityToUse,
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
      setIsLoading(false);
    }
  };

  const showDatePickerModal = (mode: 'expiry' | 'purchase') => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const handleDateConfirm = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const updatedItems = scannedItems.map((item, index) => {
      if (index === currentItemIndex) {
        return {
          ...item,
          [datePickerMode]: dateString,
        };
      }
      return item;
    });
    setScannedItems(updatedItems);
    setDatePickerVisible(false);
  };

  const handleDateCancel = () => {
    setDatePickerVisible(false);
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

            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollViewContent}
            >
              <View style={styles.itemDetails}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.name ?? ''}
                    onChangeText={(value) => updateItemField('name', value)}
                    placeholder="Item name"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={String(currentItem.quantity ?? '')}
                      onChangeText={(value) => updateItemField('quantity', value)}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      value={currentItem.unit ?? ''}
                      onChangeText={(value) => updateItemField('unit', value)}
                      placeholder="unit"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.category ?? ''}
                    onChangeText={(value) => updateItemField('category', value)}
                    placeholder="Category"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        // console.log('Expiry date pressed');
                        showDatePickerModal('expiry');
                      }}
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
                      onPress={() => {
                        console.log('Purchase date pressed');
                        showDatePickerModal('purchase');
                      }}
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
                    value={currentItem.location ?? ''}
                    onChangeText={(value) => updateItemField('location', value)}
                    placeholder="Pantry"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={currentItem.brand ?? ''}
                    onChangeText={(value) => updateItemField('brand', value)}
                    placeholder="Brand (optional)"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={currentItem.notes ?? ''}
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
                style={[styles.modalButton, styles.nextButton, { marginLeft: isFirstItem ? 0 : 12 }]}
                onPress={handleNextItem}
              >
                <Text style={styles.buttonText}>
                  {isLastItem ? 'Add All Items' : 'Next Item'}
                </Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={handleDateCancel}
              date={currentItem[datePickerMode] ? new Date(currentItem[datePickerMode] + 'T00:00:00') : new Date()}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      <View style={styles.overlay}>
        <View style={styles.controls}>
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
      </View>
      {renderItemModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  message: { 
    textAlign: 'center', 
    padding: 20, 
    color: '#fff' 
  },
  permissionButton: {
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  controls: {
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
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxWidth: 380,
    height: '65%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flexGrow: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    flexShrink: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 8,
  },
  itemDetails: {
    gap: 6,
    padding: 2, // Added padding on all edges as requested
  },
  inputGroup: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 6,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    minHeight: 36,
  },
  notesInput: {
    height: 50,
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 6,
    backgroundColor: '#f9f9f9',
    minHeight: 36,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    // Increased padding inside buttons as requested
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    flex: 1,
  },
  skipButton: {
    backgroundColor: '#ff6b6b',
    marginRight: 12,
  },
  previousButton: {
    backgroundColor: '#666',
    marginRight: 12,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});