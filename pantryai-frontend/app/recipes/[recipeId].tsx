import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../../services/api';

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return '#4CAF50'; // Green
        case 'medium':
            return '#FFA000'; // Orange
        case 'hard':
            return '#F44336'; // Red
        default:
            return '#757575'; // Grey
    }
};

const RecipeDetailScreen: React.FC = () => {
    const router = useRouter();
    const { recipe } = useLocalSearchParams<{ recipe: string }>();
    const recipeData: Recipe = recipe ? JSON.parse(recipe) : null;

    if (!recipeData) {
        return (
            <View style={styles.container}>
                <Text>Recipe not found</Text>
            </View>
        );
    }

    const handleBackPress = () => {
        router.back();
    };

    const handleUrlPress = async () => {
        if (recipeData.url) {
            try {
                await Linking.openURL(recipeData.url);
            } catch (error) {
                console.error('Error opening URL:', error);
            }
        }
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, index) => (
            <Ionicons
                key={index}
                name={index < rating ? "star" : "star-outline"}
                size={20}
                color="#FFD700"
            />
        ));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{recipeData.name}</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Introduction Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Introduction</Text>
                    <Text style={styles.description}>{recipeData.description}</Text>
                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Ionicons name="restaurant-outline" size={20} color="#666" />
                            <Text style={styles.metaText}>Serves {recipeData.serves}</Text>
                        </View>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipeData.difficulty) }]}>
                            <Text style={styles.difficultyText}>{recipeData.difficulty}</Text>
                        </View>
                    </View>
                    <View style={styles.ratingContainer}>
                        {renderStars(recipeData.ratings)}
                        <Text style={styles.voteCount}>({recipeData.vote_count} votes)</Text>
                    </View>
                </View>

                {/* Ingredients Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    {recipeData.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                            <Ionicons name="ellipse" size={8} color="#4CAF50" style={styles.bullet} />
                            <Text style={styles.ingredientText}>{ingredient}</Text>
                        </View>
                    ))}
                </View>

                {/* Steps Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    {recipeData.steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Source Link */}
                {recipeData.url && (
                    <TouchableOpacity style={styles.sourceLink} onPress={handleUrlPress}>
                        <Text style={styles.sourceLinkText}>View Original Recipe</Text>
                        <Ionicons name="open-outline" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
        marginBottom: 15,
    },
    metaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 16,
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    difficultyText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    voteCount: {
        marginLeft: 10,
        color: '#666',
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    bullet: {
        marginRight: 10,
    },
    ingredientText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    sourceLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
        margin: 20,
        borderRadius: 10,
    },
    sourceLinkText: {
        color: '#4CAF50',
        fontSize: 16,
        marginRight: 10,
    },
});

export default RecipeDetailScreen;