// Please paste the contents of:
// 1. app/(tabs)/recipes.tsx (your recipes list screen)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecipeCard from '../../components/RecipeCard';
import { useRouter } from 'expo-router';
import { recipesApi, Recipe, RecipeResponse } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECIPES_PER_PAGE = 10;
const INITIAL_LOAD_COUNT = 30;
const STORAGE_KEY = '@pantryai_recipes_cache';

const RecipesScreen: React.FC = () => {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [searchResults, setSearchResults] = useState<Recipe[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

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
                    setAllRecipes(cachedRecipes);
                    setHasMore(cachedRecipes.length >= RECIPES_PER_PAGE);
                    setLoading(false);
                    return;
                }
            }

            // If no cache or cache is old, fetch from API
            const response: RecipeResponse = await recipesApi.matchRecipes(INITIAL_LOAD_COUNT);
            
            if (response?.matched_recipes) {
                setRecipes(response.matched_recipes);
                setAllRecipes(response.matched_recipes);
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
            setAllRecipes([]);
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
                setAllRecipes(newRecipes);
                
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim().length > 0) {
            const filtered = allRecipes.filter(recipe => 
                recipe.name.toLowerCase().includes(query.toLowerCase()) ||
                recipe.description.toLowerCase().includes(query.toLowerCase()) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(query.toLowerCase())
                )
            );
            setFilteredRecipes(filtered);
        } else {
            setFilteredRecipes([]);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setFilteredRecipes([]);
    };

    const handleFilterPress = (filterType: string) => {
        Alert.alert('Filter Clicked', `You clicked the ${filterType} filter.`);
    };

    const handleRecipeCardPress = (recipe: Recipe) => {
        console.log('Recipe card pressed:', {
            id: recipe.id,
            name: recipe.name,
            url: recipe.url
        });
        router.push({
            pathname: '/recipes/[recipeId]',
            params: {
                recipeId: recipe.id,
              recipe: JSON.stringify(recipe), // Optional: only needed if not fetching via ID
            }
          });
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

    const handleOptionsPress = () => {
        Alert.alert(
            'Options',
            'Choose an option',
            [
                {
                    text: 'View Options',
                    onPress: () => {
                        Alert.alert(
                            'View Options',
                            'Select view mode',
                            [
                                { text: 'Grid View', onPress: () => setViewMode('grid') },
                                { text: 'List View', onPress: () => setViewMode('list') },
                                { text: 'Compact View', onPress: () => setViewMode('compact') },
                                { text: 'Cancel', style: 'cancel' }
                            ]
                        );
                    }
                },
                {
                    text: 'Sort',
                    onPress: () => handleFilterPress('Sort')
                },
                {
                    text: 'Dietary',
                    onPress: () => handleFilterPress('Dietary')
                },
                {
                    text: 'Cuisine',
                    onPress: () => handleFilterPress('Cuisine')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
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
                    <TouchableOpacity style={styles.retryButton} onPress={loadInitialRecipes}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const recipesToDisplay = searchQuery.trim().length > 0 ? filteredRecipes : recipes;
        const isSearchActive = searchQuery.trim().length > 0;

        if (!Array.isArray(recipesToDisplay) || recipesToDisplay.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>
                        {isSearchActive ? 'No matching recipes found' : 'No recipes found'}
                    </Text>
                </View>
            );
        }

        // When search is active, show all filtered results without pagination
        const displayedRecipes = isSearchActive ? recipesToDisplay : recipesToDisplay.slice(
            (currentPage - 1) * RECIPES_PER_PAGE,
            currentPage * RECIPES_PER_PAGE
        );

        return (
            <ScrollView 
                style={styles.trendingSection}
                refreshControl={
                    !isSearchActive ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4CAF50']}
                            tintColor="#4CAF50"
                        />
                    ) : undefined
                }
                onScroll={({ nativeEvent }) => {
                    if (!isSearchActive) {
                        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                        const paddingToBottom = 20;
                        if (layoutMeasurement.height + contentOffset.y >= 
                            contentSize.height - paddingToBottom) {
                            handleLoadMore();
                        }
                    }
                }}
                scrollEventThrottle={400}
            >
                <View style={[
                    styles.recipesContainer,
                    viewMode === 'grid' && styles.gridContainer,
                    viewMode === 'list' && styles.listContainer,
                    viewMode === 'compact' && styles.compactContainer
                ]}>
                    {displayedRecipes.map((recipe, index) => (
                        <RecipeCard
                            key={`${recipe.id}-${index}`}
                            id={recipe.id}
                            title={recipe.name}
                            difficulty={recipe.difficulty || 'Medium'}
                            image={recipe.image_url ? { uri: recipe.image_url } : require('../../assets/placeholder_recipe.jpg')}
                            onPress={() => handleRecipeCardPress(recipe)}
                            viewMode={viewMode}
                        />
                    ))}
                </View>
                {loadingMore && !isSearchActive && (
                    <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                    </View>
                )}
                {!hasMore && recipesToDisplay.length > 0 && !isSearchActive && (
                    <Text style={styles.noMoreText}>No more recipes to load</Text>
                )}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recipes</Text>
                <TouchableOpacity onPress={handleOptionsPress} style={styles.optionsButton}>
                    <Ionicons name="options-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
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
    recipesContainer: {
        padding: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    listContainer: {
        flexDirection: 'column',
    },
    compactContainer: {
        flexDirection: 'column',
    },
    optionsButton: {
        padding: 5,
    },
});

export default RecipesScreen;