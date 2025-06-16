import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../_layout';
import { pantryApi, PantryItem } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

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

    useEffect(() => {
        fetchItems();
    }, []);

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
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4CAF50']}
                        tintColor="#4CAF50"
                    />
                }
            >
                <View style={styles.gridContainer}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
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
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderEditModal = () => {
        if (!selectedItem) return null;

        return (
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Item</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
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
                                    <TextInput
                                        style={styles.input}
                                        value={editedItem.unit || selectedItem.unit}
                                        onChangeText={(text) => setEditedItem(prev => ({ ...prev, unit: text }))}
                                        placeholder="e.g., kg, pcs"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editedItem.category || selectedItem.category}
                                    onChangeText={(text) => setEditedItem(prev => ({ ...prev, category: text }))}
                                    placeholder="e.g., Fruits, Dairy"
                                />
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

                            <View style={styles.inputGroup}>
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

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity 
                                    style={[styles.submitButton, { backgroundColor: '#4CAF50' }]} 
                                    onPress={handleEditItem}
                                >
                                    <Text style={styles.submitButtonText}>Save Changes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.submitButton, { backgroundColor: '#D32F2F', marginTop: 10 }]} 
                                    onPress={handleDeleteItem}
                                >
                                    <Text style={styles.submitButtonText}>Delete Item</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

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

            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Item</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
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
                                    <TextInput
                                        style={styles.input}
                                        value={newItem.unit}
                                        onChangeText={(text) => setNewItem(prev => ({ ...prev, unit: text }))}
                                        placeholder="e.g., kg, pcs"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Category *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newItem.category}
                                    onChangeText={(text) => setNewItem(prev => ({ ...prev, category: text }))}
                                    placeholder="e.g., Fruits, Dairy"
                                />
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

                            {showDatePicker && (
                                <DateTimePicker
                                    value={expiry || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}

                            <TouchableOpacity style={styles.submitButton} onPress={handleAddItem}>
                                <Text style={styles.submitButtonText}>Add Item</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    addButton: {
        padding: 8,
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
        flexWrap: 'wrap',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    modalBody: {
        maxHeight: '80%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F8F8F8',
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#F8F8F8',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        marginTop: 20,
    },
    submitButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PantryScreen;