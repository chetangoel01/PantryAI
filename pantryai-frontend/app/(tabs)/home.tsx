// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pantryApi, recipesApi, Recipe } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-get-random-values';


const QuickActionCard = ({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
        <Ionicons name={icon as any} size={24} color="#4CAF50" />
        <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [pantryCount, setPantryCount] = useState<number>(0);
    const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Recipe[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pantryItems, recipes] = await Promise.all([
                pantryApi.getAllItems(),
                recipesApi.matchRecipes(3)
            ]);
            setPantryCount(pantryItems?.length || 0);
            setSuggestedRecipes(recipes?.matched_recipes || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setPantryCount(0);
            setSuggestedRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'scan':
                router.push('/camera');
                break;
            case 'pantry':
                router.push('/pantry');
                break;
            case 'recipes':
                router.push('/recipes');
                break;
            case 'lists':
                router.push('/lists');
                break;
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length > 0) {
            setSearchLoading(true);
            try {
                const response = await recipesApi.searchRecipes(query);
                setSearchResults(response.results);
                setIsSearching(true);
            } catch (error) {
                console.error('Error searching recipes:', error);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Welcome to PantryAI</Text>
            </View>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>
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
                {isSearching ? (
                    <View style={styles.suggestedRecipes}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Search Results</Text>
                        </View>
                        {searchLoading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                            </View>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((recipe) => (
                                <TouchableOpacity
                                    key={recipe.id}
                                    style={styles.recipeCard}
                                    onPress={() => router.push({
                                        pathname: '/recipes/[recipeId]',
                                        params: { 
                                            recipeId: recipe.id.toString(),
                                            recipe: JSON.stringify(recipe)
                                        }
                                    })}
                                >
                                    <Image
                                        source={recipe.image_url ? { uri: recipe.image_url } : require('../../assets/placeholder_recipe.jpg')}
                                        style={styles.recipeImage}
                                    />
                                    <View style={styles.recipeInfo}>
                                        <Text style={styles.recipeTitle} numberOfLines={1}>
                                            {recipe.name}
                                        </Text>
                                        <Text style={styles.recipeDescription} numberOfLines={2}>
                                            {recipe.description}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>No recipes found</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <>
                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            <QuickActionCard
                                icon="scan-outline"
                                title="Scan Item"
                                onPress={() => handleQuickAction('scan')}
                            />
                            <QuickActionCard
                                icon="restaurant-outline"
                                title="View Pantry"
                                onPress={() => handleQuickAction('pantry')}
                            />
                            <QuickActionCard
                                icon="book-outline"
                                title="Recipes"
                                onPress={() => handleQuickAction('recipes')}
                            />
                            <QuickActionCard
                                icon="list-outline"
                                title="Shopping Lists"
                                onPress={() => handleQuickAction('lists')}
                            />
                        </View>

                        {/* Pantry Stats */}
                        <View style={styles.statsCard}>
                            <View style={styles.statsHeader}>
                                <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
                                <Text style={styles.statsTitle}>Pantry Overview</Text>
                            </View>
                            <View style={styles.statsContent}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{pantryCount}</Text>
                                    <Text style={styles.statLabel}>Items in Pantry</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>
                                        {suggestedRecipes.length}
                                    </Text>
                                    <Text style={styles.statLabel}>Recipe Matches</Text>
                                </View>
                            </View>
                        </View>

                        {/* Suggested Recipes */}
                        <View style={styles.suggestedRecipes}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Suggested Recipes</Text>
                                <TouchableOpacity onPress={() => handleQuickAction('recipes')}>
                                    <Text style={styles.seeAllText}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            {suggestedRecipes.map((recipe) => (
                                <TouchableOpacity
                                    key={recipe.id}
                                    style={styles.recipeCard}
                                    onPress={() => router.push({
                                        pathname: '/recipes/[recipeId]',
                                        params: { 
                                            recipeId: recipe.id.toString(),
                                            recipe: JSON.stringify(recipe)
                                        }
                                    })}
                                >
                                    <Image
                                        source={recipe.image_url ? { uri: recipe.image_url } : require('../../assets/placeholder_recipe.jpg')}
                                        style={styles.recipeImage}
                                    />
                                    <View style={styles.recipeInfo}>
                                        <Text style={styles.recipeTitle} numberOfLines={1}>
                                            {recipe.name}
                                        </Text>
                                        <Text style={styles.recipeDescription} numberOfLines={2}>
                                            {recipe.description}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
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
    container: {
        flex: 1,
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
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
    },
    quickActionCard: {
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 12,
        width: '23%',
    },
    quickActionText: {
        marginTop: 8,
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    statsCard: {
        margin: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
        color: '#333',
    },
    statsContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    suggestedRecipes: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        color: '#4CAF50',
        fontSize: 14,
    },
    recipeCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recipeImage: {
        width: 100,
        height: 100,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    recipeInfo: {
        flex: 1,
        padding: 15,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    recipeDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginHorizontal: 20,
        marginTop: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        height: 36,
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    },
    searchIcon: {
        marginRight: 4,
    },
    clearButton: {
        padding: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default HomeScreen;