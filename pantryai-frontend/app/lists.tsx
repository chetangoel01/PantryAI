import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootTabParamList } from './_layout';

type ListsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'lists'>;

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  quantityType: string;
  completed: boolean;
}

const QUANTITY_TYPES = ['pcs', 'kg', 'g', 'l', 'ml', 'oz', 'lb'];

const ListsScreen: React.FC = () => {
  const navigation = useNavigation<ListsScreenNavigationProp>();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  // Dropdown picker states
  const [open, setOpen] = useState(false);
  const [itemsPicker, setItemsPicker] = useState(
    QUANTITY_TYPES.map((type) => ({ label: type, value: type }))
  );
  const [newItemQuantityType, setNewItemQuantityType] = useState('pcs');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem('shoppingItems');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const quantity = parseInt(newItemQuantity) || 1;
    if (quantity < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    try {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        quantity: quantity,
        quantityType: newItemQuantityType,
        completed: false,
      };

      const updatedItems = [...items, newItem];
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemQuantityType('pcs');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const toggleItemComplete = async (itemId: string) => {
    try {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const updatedItems = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping List</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Add new item..."
          onSubmitEditing={handleAddItem}
        />
        <TextInput
          style={[styles.input, styles.quantityInput]}
          value={newItemQuantity}
          onChangeText={setNewItemQuantity}
          placeholder="Qty"
          keyboardType="number-pad"
          maxLength={3}
        />

        <DropDownPicker
          open={open}
          value={newItemQuantityType}
          items={itemsPicker}
          setOpen={setOpen}
          setValue={setNewItemQuantityType}
          setItems={setItemsPicker}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainerStyle}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {items.length === 0 ? (
          <View style={styles.content}>
            <Text style={styles.emptyText}>No items in your shopping list</Text>
            <Text style={styles.subText}>Add items to get started</Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {items.map((item) => (
              <View
                key={item.id}
                style={[styles.item, item.completed && styles.itemCompleted]}
              >
                <View style={styles.itemContent}>
                  <TouchableOpacity
                    onPress={() => toggleItemComplete(item.id)}
                    style={styles.checkboxContainer}
                  >
                    <Ionicons
                      name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={item.completed ? "#4CAF50" : "#666"}
                    />
                  </TouchableOpacity>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, item.completed && styles.itemNameCompleted]}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        style={styles.quantityButton}
                      >
                        <Ionicons name="remove" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        style={styles.quantityButton}
                      >
                        <Ionicons name="add" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.quantityTypeText}>{item.quantityType}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteItem(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  nameInput: {
    flex: 1,
    marginRight: 8,
  },
  quantityInput: {
    width: 60,
    marginRight: 8,
    textAlign: 'center',
  },
  dropdownContainer: {
    width: 100,
    marginRight: 8,
    height: 40,
    marginTop: 0,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    minHeight: 40,
  },
  dropDownContainerStyle: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 0,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#666',
  },
  itemsContainer: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemCompleted: {
    backgroundColor: '#F5F5F5',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    padding: 4,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  quantityTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    minWidth: 30,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ListsScreen;
