import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface RecipeCardProps {
    id: string;
    title: string;
    difficulty: string;
    image: { uri: string } | number;
    onPress: () => void;
    viewMode?: 'grid' | 'list' | 'compact';
}

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

const RecipeCard: React.FC<RecipeCardProps> = ({ title, difficulty, image, onPress, viewMode = 'grid' }) => {
    const getCardStyle = () => {
        switch (viewMode) {
            case 'list':
                return styles.listCard;
            case 'compact':
                return styles.compactCard;
            default:
                return styles.gridCard;
        }
    };

    const getImageStyle = () => {
        switch (viewMode) {
            case 'list':
                return styles.listImage;
            case 'compact':
                return styles.compactImage;
            default:
                return styles.gridImage;
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.card, getCardStyle()]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image 
                source={image} 
                style={[styles.image, getImageStyle()]} 
                resizeMode="cover"
            />
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={viewMode === 'compact' ? 1 : 2}>{title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
                    <Text style={styles.difficultyText}>{difficulty}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
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
    gridCard: {
        width: '48%',
        marginBottom: 15,
    },
    listCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
    },
    compactCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 10,
    },
    image: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    gridImage: {
        width: '100%',
        height: 150,
    },
    listImage: {
        width: 120,
        height: 120,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    compactImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    content: {
        padding: 15,
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    difficultyBadge: {
        alignSelf: 'flex-start',
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
});

export default RecipeCard;