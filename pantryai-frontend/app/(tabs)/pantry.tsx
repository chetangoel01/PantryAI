import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { pantryApi, PantryItem } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { RootTabParamList } from '../_layout';

const QUANTITY_TYPES = ['pcs', 'kg', 'g', 'l', 'ml', 'oz', 'lb'];

const GROCERY_CATEGORIES = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Dry Goods",
  "Canned & Jarred",
  "Baking",
  "Frozen Foods",
  "Beverages",
  "Snacks & Sweets",
  "Condiments & Sauces",
  "Oils & Vinegars",
  "Spices & Seasonings",
  "International Foods",
  "Health & Wellness",
  "Personal Care",
  "Household Supplies",
  "Baby & Kids",
  "Pet Supplies",
  "Other"
];

type PantryScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'pantry'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // 20px padding on each side, 20px gap between cards

const PantryScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [items, setItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
    const [editedItem, setEditedItem] = useState<Partial<PantryItem>>({});
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '',
        unit: '',
        category: '',
    });
    const [expiry, setExpiry] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'expiry' | 'purchase'>('expiry');
    const [open, setOpen] = useState(false);
    const [itemsPicker, setItemsPicker] = useState(
        QUANTITY_TYPES.map((type) => ({ label: type, value: type }))
    );
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categoryItems, setCategoryItems] = useState(
        GROCERY_CATEGORIES.map((category) => ({ label: category, value: category }))
    );
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [editUnitOpen, setEditUnitOpen] = useState(false);
    const [editCategoryOpen, setEditCategoryOpen] = useState(false);
    const [showEditCustomCategory, setShowEditCustomCategory] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    // When loading an existing item for editing
    useEffect(() => {
        if (editedItem?.expiry) {
            setExpiry(new Date(editedItem.expiry));
        }
    }, [editedItem]);

    useEffect(() => {
        // Handle scanned items if they exist in params
        if (params.scannedItems) {
            try {
                const scannedItems = JSON.parse(params.scannedItems as string) as PantryItem[];
                Alert.alert(
                    'Scanned Items',
                    `Found ${scannedItems.length} items. Would you like to add them to your pantry?`,
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Add Items',
                            onPress: async () => {
                                try {
                                    const result = await pantryApi.confirmAddItems(scannedItems);
                                    setItems(prevItems => [...prevItems, ...result.inserted]);
                                    Alert.alert('Success', 'Items added to pantry successfully!');
                                } catch (error) {
                                    console.error('Error adding scanned items:', error);
                                    Alert.alert('Error', 'Failed to add items to pantry. Please try again.');
                                }
                            },
                        },
                    ]
                );
            } catch (error) {
                console.error('Error parsing scanned items:', error);
            }
        }
    }, [params.scannedItems]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await pantryApi.getAllItems();
            setItems(data);
        } catch (err) {
            console.error('Error fetching pantry items:', err);
            setError('Failed to load pantry items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchItems();
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.category) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const itemData: Omit<PantryItem, 'id'> = {
                name: newItem.name,
                quantity: parseFloat(newItem.quantity),
                unit: newItem.unit,
                category: newItem.category,
                purchase_date: new Date().toISOString(),
                location: 'pantry',
                is_opened: false,
                added_at: new Date().toISOString(),
                expiry: expiry ? expiry.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const addedItem = await pantryApi.addItem(itemData);
            setItems(prevItems => [...prevItems, addedItem]);
            setShowAddModal(false);
            setNewItem({ name: '', quantity: '', unit: '', category: '' });
            setExpiry(null);
            Alert.alert('Success', 'Item added successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to add item. Please try again.');
        }
    };

    const handleEditItem = async () => {
        if (!selectedItem) return;

        try {
            console.log('Updating item with ID:', selectedItem.id);
            const updatedItem = await pantryApi.updateItem(selectedItem.id, editedItem);
            setItems(prevItems => 
                prevItems.map(item => 
                    item.id === selectedItem.id ? updatedItem : item
                )
            );
            setShowEditModal(false);
            setSelectedItem(null);
            setEditedItem({});
            Alert.alert('Success', 'Item updated successfully');
        } catch (error) {
            console.error('Error updating item:', error);
            Alert.alert('Error', 'Failed to update item. Please try again.');
        }
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;

        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete ${selectedItem.name}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('Deleting item with ID:', selectedItem.id);
                            await pantryApi.deleteItem(selectedItem.id);
                            setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
                            setShowEditModal(false);
                            setSelectedItem(null);
                            Alert.alert('Success', 'Item deleted successfully');
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            if (datePickerMode === 'expiry') {
                setEditedItem(prev => ({ ...prev, expiry: selectedDate.toISOString() }));
            } else {
                setEditedItem(prev => ({ ...prev, purchase_date: selectedDate.toISOString() }));
            }
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === 'Other') {
            setShowCustomCategory(true);
            setNewItem(prev => ({ ...prev, category: '' }));
        } else {
            setShowCustomCategory(false);
            setNewItem(prev => ({ ...prev, category: value }));
        }
    };

    const handleEditCategoryChange = (value: string) => {
        if (value === 'Other') {
            setShowEditCustomCategory(true);
            setEditedItem(prev => ({ ...prev, category: '' }));
        } else {
            setShowEditCustomCategory(false);
            setEditedItem(prev => ({ ...prev, category: value }));
        }
    };

    const handleEditDropdownOpen = (dropdownType: 'unit' | 'category') => {
        if (dropdownType === 'unit') {
            setEditCategoryOpen(false);
        } else {
            setEditUnitOpen(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (items.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Your pantry is empty</Text>
                    <Text style={styles.subText}>Add items to get started</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={items}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => {
                            console.log('Item pressed:', {
                                id: item.id,
                                name: item.name,
                                quantity: item.quantity,
                                unit: item.unit,
                                category: item.category,
                                expiry: item.expiry
                            });
                            setSelectedItem(item);
                            setShowEditModal(true);
                        }}
                    >
                        {item.image_url && (
                            <Image
                                source={{ uri: item.image_url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.cardContent}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDetails}>
                                {item.quantity} {item.unit}
                            </Text>
                            <Text style={styles.category}>{item.category}</Text>
                            {item.expiry && (
                                <View style={styles.expiryContainer}>
                                    <Ionicons name="time-outline" size={16} color="#D32F2F" />
                                    <Text style={styles.expiryDate}>
                                        Expires: {new Date(item.expiry).toLocaleDateString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.gridContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4CAF50']}
                        tintColor="#4CAF50"
                    />
                }
            />
        );
    };

    const handleDropdownOpen = (dropdownType: 'unit' | 'category') => {
        if (dropdownType === 'unit') {
            setCategoryOpen(false);
        } else {
            setOpen(false);
        }
    };

    const renderEditModal = () => {
        if (!selectedItem) return null;

        return (
            <Modal
                visible={showEditModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Item</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.editModalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedItem.name || selectedItem.name}
                                    onChangeText={(text) => setEditedItem(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter item name"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Quantity *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editedItem.quantity?.toString() || selectedItem.quantity.toString()}
                                        onChangeText={(text) => setEditedItem(prev => ({ ...prev, quantity: parseFloat(text) }))}
                                        placeholder="Enter quantity"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Unit *</Text>
                                    <DropDownPicker
                                        open={editUnitOpen}
                                        value={editedItem.unit || selectedItem.unit}
                                        items={itemsPicker}
                                        setOpen={(isOpen) => {
                                            setEditUnitOpen(isOpen);
                                            handleEditDropdownOpen('unit');
                                        }}
                                        setValue={(callback) => {
                                            const value = typeof callback === 'function' ? callback(editedItem.unit || selectedItem.unit) : callback;
                                            setEditedItem(prev => ({ ...prev, unit: value }));
                                        }}
                                        setItems={setItemsPicker}
                                        containerStyle={styles.unitDropdownContainer}
                                        style={styles.unitDropdown}
                                        dropDownContainerStyle={styles.unitDropDownContainerStyle}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category *</Text>
                                {!showEditCustomCategory ? (
                                    <DropDownPicker
                                        open={editCategoryOpen}
                                        value={editedItem.category || selectedItem.category}
                                        items={categoryItems}
                                        setOpen={(isOpen) => {
                                            setEditCategoryOpen(isOpen);
                                            handleEditDropdownOpen('category');
                                        }}
                                        setValue={(callback) => {
                                            const value = typeof callback === 'function' ? callback(editedItem.category || selectedItem.category) : callback;
                                            handleEditCategoryChange(value);
                                        }}
                                        setItems={setCategoryItems}
                                        containerStyle={styles.categoryDropdownContainer}
                                        style={styles.categoryDropdown}
                                        dropDownContainerStyle={styles.categoryDropDownContainerStyle}
                                    />
                                ) : (
                                    <View style={styles.customCategoryContainer}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            value={editedItem.category || ''}
                                            onChangeText={(text) => setEditedItem(prev => ({ ...prev, category: text }))}
                                            placeholder="Enter custom category"
                                        />
                                        <TouchableOpacity 
                                            style={styles.backButton}
                                            onPress={() => {
                                                setShowEditCustomCategory(false);
                                                setEditedItem(prev => ({ ...prev, category: selectedItem.category }));
                                            }}
                                        >
                                            <Ionicons name="arrow-back" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Expiry Date</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        setDatePickerMode('expiry');
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {editedItem.expiry 
                                            ? new Date(editedItem.expiry).toLocaleDateString()
                                            : selectedItem.expiry 
                                                ? new Date(selectedItem.expiry).toLocaleDateString()
                                                : 'Select date'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.lastInputGroup}>
                                <Text style={styles.label}>Purchase Date</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => {
                                        setDatePickerMode('purchase');
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {editedItem.purchase_date 
                                            ? new Date(editedItem.purchase_date).toLocaleDateString()
                                            : selectedItem.purchase_date 
                                                ? new Date(selectedItem.purchase_date).toLocaleDateString()
                                                : 'Select date'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={datePickerMode === 'expiry' 
                                        ? (editedItem.expiry ? new Date(editedItem.expiry) : new Date(selectedItem.expiry))
                                        : (editedItem.purchase_date ? new Date(editedItem.purchase_date) : new Date(selectedItem.purchase_date))}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}

                            <View style={styles.editButtonContainer}>
                                <TouchableOpacity 
                                    style={[styles.editSubmitButton, { flex: 1, marginRight: 10 }]}
                                    onPress={handleEditItem}
                                >
                                    <Text style={styles.submitButtonText}>Save Changes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.deleteButton, { flex: 1 }]}
                                    onPress={handleDeleteItem}
                                >
                                    <Text style={styles.submitButtonText}>Delete Item</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderAddModal = () => (
        <Modal
            visible={showAddModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowAddModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.addModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Item</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.addModalBody}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={newItem.name}
                                onChangeText={(text) => setNewItem(prev => ({ ...prev, name: text }))}
                                placeholder="Enter item name"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Quantity *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newItem.quantity}
                                    onChangeText={(text) => setNewItem(prev => ({ ...prev, quantity: text }))}
                                    placeholder="Enter quantity"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Unit *</Text>
                                <DropDownPicker
                                    open={open}
                                    value={newItem.unit}
                                    items={itemsPicker}
                                    setOpen={(isOpen) => {
                                        setOpen(isOpen);
                                        handleDropdownOpen('unit');
                                    }}
                                    setValue={(callback) => {
                                        const value = typeof callback === 'function' ? callback(newItem.unit) : callback;
                                        setNewItem(prev => ({ ...prev, unit: value }));
                                    }}
                                    setItems={setItemsPicker}
                                    containerStyle={styles.unitDropdownContainer}
                                    style={styles.unitDropdown}
                                    dropDownContainerStyle={styles.unitDropDownContainerStyle}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category *</Text>
                            {!showCustomCategory ? (
                                <DropDownPicker
                                    open={categoryOpen}
                                    value={newItem.category}
                                    items={categoryItems}
                                    setOpen={(isOpen) => {
                                        setCategoryOpen(isOpen);
                                        handleDropdownOpen('category');
                                    }}
                                    setValue={(callback) => {
                                        const value = typeof callback === 'function' ? callback(newItem.category) : callback;
                                        handleCategoryChange(value);
                                    }}
                                    setItems={setCategoryItems}
                                    containerStyle={styles.categoryDropdownContainer}
                                    style={styles.categoryDropdown}
                                    dropDownContainerStyle={styles.categoryDropDownContainerStyle}
                                />
                            ) : (
                                <View style={styles.customCategoryContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={newItem.category}
                                        onChangeText={(text) => setNewItem(prev => ({ ...prev, category: text }))}
                                        placeholder="Enter custom category"
                                    />
                                    <TouchableOpacity 
                                        style={styles.backButton}
                                        onPress={() => {
                                            setShowCustomCategory(false);
                                            setNewItem(prev => ({ ...prev, category: '' }));
                                        }}
                                    >
                                        <Ionicons name="arrow-back" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Expiry Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    {expiry ? expiry.toLocaleDateString() : 'Select date'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.lastInputGroup}>
                            <Text style={styles.label}>Purchase Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => {
                                    setDatePickerMode('purchase');
                                    setShowDatePicker(true);
                                }}
                            >
                                <Text style={styles.dateButtonText}>
                                    {new Date().toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={expiry || new Date()}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                minimumDate={new Date()}
                            />
                        )}

                        <TouchableOpacity style={styles.addSubmitButton} onPress={handleAddItem}>
                            <Text style={styles.submitButtonText}>Add Item</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Pantry</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
            </View>
            {renderContent()}
            {renderEditModal()}
            {renderAddModal()}
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
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        padding: 8,
        zIndex: 9999,
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        padding: 10,
        justifyContent: 'space-between',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: CARD_WIDTH,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardContent: {
        padding: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    category: {
        fontSize: 12,
        color: '#4CAF50',
        marginBottom: 4,
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    expiryDate: {
        fontSize: 12,
        color: '#D32F2F',
        marginLeft: 4,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'relative',
    },
    inputGroup: {
        marginBottom: 8,
        position: 'relative',
    },
    lastInputGroup: {
        marginBottom: 16,
        position: 'relative',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        backgroundColor: '#F8F8F8',
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 8,
        backgroundColor: '#F8F8F8',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#333',
    },
    addModalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addModalBody: {
        maxHeight: '80%',
        paddingBottom: 16,
    },
    addSubmitButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        marginTop: 20,
        width: '100%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    editModalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    editModalBody: {
        maxHeight: '80%',
        paddingBottom: 16,
    },
    editButtonContainer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editSubmitButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    deleteButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#D32F2F',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    unitDropdownContainer: {
        width: '100%',
        marginRight: 8,
        height: 40,
        marginTop: 0,
        zIndex: 2000,
    },
    unitDropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        minHeight: 40,
    },
    unitDropDownContainerStyle: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginTop: 0,
        position: 'absolute',
        width: '100%',
        zIndex: 2000,
    },
    categoryDropdownContainer: {
        width: '100%',
        marginRight: 8,
        height: 40,
        marginTop: 0,
        zIndex: 1000,
    },
    categoryDropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        minHeight: 40,
    },
    categoryDropDownContainerStyle: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginTop: 0,
        position: 'absolute',
        width: '100%',
        zIndex: 1000,
    },
    customCategoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        padding: 8,
        marginLeft: 8,
    },
});

export default PantryScreen;