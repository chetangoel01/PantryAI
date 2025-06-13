import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pantryApi, PantryItem } from '../../services/api';

type ItemDetailScreenNavigationProp = StackNavigationProp<any, '[itemId]'>;

const ItemDetailScreen: React.FC = () => {
    const { itemId } = useLocalSearchParams();
    const navigation = useNavigation<ItemDetailScreenNavigationProp>();
    const [item, setItem] = useState<PantryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [category, setCategory] = useState('');
    const [expiry, setExpiry] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchItem();
    }, [itemId]);

    const fetchItem = async () => {
        try {
            setLoading(true);
            const response = await pantryApi.getAllItems();
            const foundItem = response.find(i => i.id === itemId);
            if (foundItem) {
                setItem(foundItem);
                setName(foundItem.name);
                setQuantity(foundItem.quantity.toString());
                setUnit(foundItem.unit);
                setCategory(foundItem.category);
                setExpiry(foundItem.expiry ? new Date(foundItem.expiry) : null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load item details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !quantity || !unit || !category) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await pantryApi.updateItem(itemId as string, {
                name,
                quantity: parseFloat(quantity),
                unit,
                category,
                expiry: expiry?.toISOString(),
            });
            setEditing(false);
            fetchItem();
            Alert.alert('Success', 'Item updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update item');
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await pantryApi.deleteItem(itemId as string);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    },
                },
            ]
        );
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setExpiry(selectedDate);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Item not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editing ? 'Edit Item' : 'Item Details'}</Text>
                <TouchableOpacity
                    onPress={() => setEditing(!editing)}
                    style={styles.editButton}
                >
                    <Ionicons
                        name={editing ? 'close' : 'create-outline'}
                        size={24}
                        color="#333"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter item name"
                            />
                        ) : (
                            <Text style={styles.value}>{item.name}</Text>
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Quantity</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.input}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    placeholder="Enter quantity"
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.value}>{item.quantity}</Text>
                            )}
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Unit</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.input}
                                    value={unit}
                                    onChangeText={setUnit}
                                    placeholder="e.g., kg, pcs"
                                />
                            ) : (
                                <Text style={styles.value}>{item.unit}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={category}
                                onChangeText={setCategory}
                                placeholder="e.g., Fruits, Dairy"
                            />
                        ) : (
                            <Text style={styles.value}>{item.category}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date</Text>
                        {editing ? (
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    {expiry ? expiry.toLocaleDateString() : 'Select date'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.value}>
                                {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'Not set'}
                            </Text>
                        )}
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

                    {editing && (
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Delete Item</Text>
                    </TouchableOpacity>
                </View>
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
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    editButton: {
        padding: 8,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    value: {
        fontSize: 16,
        color: '#666',
        padding: 12,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
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
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#D32F2F',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F',
    },
});

export default ItemDetailScreen;
