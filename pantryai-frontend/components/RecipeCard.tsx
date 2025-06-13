import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface RecipeCardProps {
    id: string;
    title: string;
    difficulty: string;
    image: any;
    onPress: () => void;
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

const RecipeCard: React.FC<RecipeCardProps> = ({ title, difficulty, image, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={image} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
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
        marginHorizontal: 20,
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
    image: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    content: {
        padding: 15,
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