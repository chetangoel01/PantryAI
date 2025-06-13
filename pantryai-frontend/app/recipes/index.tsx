import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from '../../components/RecipeCard';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { recipesApi, Recipe, RecipeResponse } from '../../services/api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the parameter list for your RecipesStack (must match _layout.tsx)
type RecipesStackParamList = {
    recipesMain: undefined;
    recipeDetail: { recipeId: string };
};

// Type for the navigation prop
type RecipesScreenNavigationProp = StackNavigationProp<RecipesStackParamList, 'recipesMain'>;

const RECIPES_PER_PAGE = 10;
const INITIAL_LOAD_COUNT = 30;
const STORAGE_KEY = '@pantryai_recipes_cache';

const RecipesScreen: React.FC = () => {
    const navigation = useNavigation<RecipesScreenNavigationProp>();
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadInitialRecipes();
    }, []);

    const loadInitialRecipes = async () => {
        try {
            setLoading(true);
            
            // Try to load from cache first
            const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
            const now = Date.now();
            
            if (cachedData) {
                const { recipes: cachedRecipes, timestamp } = JSON.parse(cachedData);
                // Use cache if it's less than 1 hour old
                if (now - timestamp < 3600000) {
                    setRecipes(cachedRecipes);
                    setHasMore(cachedRecipes.length >= RECIPES_PER_PAGE);
                    setLoading(false);
                    return;
                }
            }

            // If no cache or cache is old, fetch from API
            const response: RecipeResponse = await recipesApi.matchRecipes(INITIAL_LOAD_COUNT);
            
            if (response?.matched_recipes) {
                setRecipes(response.matched_recipes);
                setHasMore(response.matched_recipes.length >= RECIPES_PER_PAGE);
                
                // Cache the results
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                    recipes: response.matched_recipes,
                    timestamp: now
                }));
            } else {
                console.error('Invalid response format:', response);
                setError('Invalid response from server');
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching recipes:', err);
            setError('Failed to load recipes. Please try again later.');
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            const nextPage = currentPage + 1;
            const startIndex = (nextPage - 1) * RECIPES_PER_PAGE;
            const endIndex = startIndex + RECIPES_PER_PAGE;
            
            // Check if we have enough recipes in cache
            if (startIndex < recipes.length) {
                setCurrentPage(nextPage);
                setHasMore(endIndex < recipes.length);
            } else {
                // If we've exhausted the cache, fetch more
                fetchMoreRecipes();
            }
            setLoadingMore(false);
        }
    };

    const fetchMoreRecipes = async () => {
        try {
            const response: RecipeResponse = await recipesApi.matchRecipes(INITIAL_LOAD_COUNT);
            
            if (response?.matched_recipes) {
                // Append new recipes to existing ones
                const newRecipes = [...recipes, ...response.matched_recipes];
                setRecipes(newRecipes);
                
                // Update cache
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                    recipes: newRecipes,
                    timestamp: Date.now()
                }));
                
                setHasMore(response.matched_recipes.length >= RECIPES_PER_PAGE);
            }
        } catch (err) {
            console.error('Error fetching more recipes:', err);
            setError('Failed to load more recipes');
        }
    };

    const handleSearchPress = () => {
        Alert.alert('Search Clicked', 'Implement search functionality here!');
    };

    const handleFilterPress = (filterType: string) => {
        Alert.alert('Filter Clicked', `You clicked the ${filterType} filter.`);
    };

    const handleRecipeCardPress = (recipe: Recipe) => {
        console.log('Recipe card pressed:', recipe.id);
        router.push(`/recipes/${recipe.id}`);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            // Clear the cache
            await AsyncStorage.removeItem(STORAGE_KEY);
            // Reload recipes
            await loadInitialRecipes();
        } catch (error) {
            console.error('Error refreshing recipes:', error);
            setError('Failed to refresh recipes');
        } finally {
            setRefreshing(false);
        }
    }, []);

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
                    <TouchableOpacity style={styles.retryButton} onPress={loadInitialRecipes}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!Array.isArray(recipes) || recipes.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No recipes found</Text>
                </View>
            );
        }

        const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
        const endIndex = startIndex + RECIPES_PER_PAGE;
        const displayedRecipes = recipes.slice(startIndex, endIndex);

        return (
            <ScrollView 
                style={styles.trendingSection}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4CAF50']}
                        tintColor="#4CAF50"
                    />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const paddingToBottom = 20;
                    if (layoutMeasurement.height + contentOffset.y >= 
                        contentSize.height - paddingToBottom) {
                        handleLoadMore();
                    }
                }}
                scrollEventThrottle={400}
            >
                <Text style={styles.sectionTitle}>Recommended Recipes</Text>
                {displayedRecipes.map((recipe, index) => (
                    <RecipeCard
                        key={`${recipe.id}-${startIndex + index}`}
                        id={recipe.id}
                        title={recipe.name}
                        difficulty={recipe.difficulty || 'Medium'}
                        image={recipe.url ? { uri: recipe.url } : require('../../assets/placeholder_recipe.jpg')}
                        onPress={() => handleRecipeCardPress(recipe)}
                    />
                ))}
                {loadingMore && (
                    <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.loadingMoreText}>Loading more recipes...</Text>
                    </View>
                )}
                {!hasMore && recipes.length > 0 && (
                    <Text style={styles.noMoreText}>No more recipes to load</Text>
                )}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recipes</Text>
                <TouchableOpacity onPress={() => Alert.alert('Options', 'Open options menu.')}>
                    <Ionicons name="ellipsis-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search recipes"
                    placeholderTextColor="#888"
                    editable={false}
                />
            </TouchableOpacity>

            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.filterButton} onPress={() => handleFilterPress('Sort')}>
                    <Text style={styles.filterButtonText}>Sort</Text>
                    <Ionicons name="chevron-down" size={16} color="black" style={styles.filterIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton} onPress={() => handleFilterPress('Dietary')}>
                    <Text style={styles.filterButtonText}>Dietary</Text>
                    <Ionicons name="chevron-down" size={16} color="black" style={styles.filterIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton} onPress={() => handleFilterPress('Cuisine')}>
                    <Text style={styles.filterButtonText}>Cuisine</Text>
                    <Ionicons name="chevron-down" size={16} color="black" style={styles.filterIcon} />
                </TouchableOpacity>
            </View>

            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginHorizontal: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0ffe0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    filterButtonText: {
        fontSize: 14,
        color: '#333',
        marginRight: 5,
    },
    filterIcon: {
        marginLeft: 5,
    },
    trendingSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginBottom: 15,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    loadingMoreContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingMoreText: {
        marginTop: 10,
        color: '#666',
    },
    noMoreText: {
        textAlign: 'center',
        color: '#666',
        padding: 20,
    },
});

export default RecipesScreen;