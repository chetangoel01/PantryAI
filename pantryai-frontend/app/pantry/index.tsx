import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../_layout';
import { pantryApi, PantryItem } from '../../services/api';

type PantryScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'pantry'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // 20px padding on each side, 20px gap between cards

const PantryScreen: React.FC = () => {
    const router = useRouter();
    const [items, setItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchPantryItems();
        } catch (error) {
            console.error('Error refreshing pantry items:', error);
            setError('Failed to refresh pantry items');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const fetchPantryItems = async () => {
        try {
            setLoading(true);
            const response = await pantryApi.getAllItems();
            setItems(response);
            setError(null);
        } catch (err) {
            console.error('Error fetching pantry items:', err);
            setError('Failed to load pantry items. Please try again later.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPantryItems();
    }, []);

    const renderContent = () => {
        if (loading && !refreshing) {
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
                    <TouchableOpacity style={styles.retryButton} onPress={fetchPantryItems}>
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
                                Alert.alert(
                                    'View Item',
                                    `Would you like to view details for ${item.name}?`,
                                    [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel'
                                        },
                                        {
                                            text: 'View',
                                            onPress: () => {
                                                console.log('Navigating to item:', item.id);
                                                router.push(`/pantry/${item.id}`);
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Image 
                                source={require('../../assets/placeholder_food.jpg')}
                                style={styles.image}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemDetails} numberOfLines={1}>
                                    {item.quantity} {item.unit}
                                </Text>
                                <Text style={styles.category}>{item.category}</Text>
                                {item.expiry && (
                                    <View style={styles.expiryContainer}>
                                        <Ionicons name="time-outline" size={14} color="#D32F2F" />
                                        <Text style={styles.expiryDate}>
                                            {new Date(item.expiry).toLocaleDateString()}
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Pantry</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                        Alert.alert(
                            'Add New Item',
                            'Would you like to add a new item to your pantry?',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel'
                                },
                                {
                                    text: 'Add',
                                    onPress: () => {
                                        console.log('Navigating to new item form');
                                        router.push('/pantry/new');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
            </View>
            {renderContent()}
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
});

export default PantryScreen;