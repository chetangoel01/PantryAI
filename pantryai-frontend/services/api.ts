import axios from 'axios';

const API_BASE_URL = 'https://pantryai.onrender.com'; // Change this to your backend URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface PantryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expiry: string;
    purchase_date: string;
    location: string;
    brand?: string;
    barcode?: string;
    notes?: string;
    is_opened: boolean;
    added_at: string;
}

export interface Recipe {
    id: string;
    name: string;
    author: string;
    description: string;
    difficulty: string;
    dish_type: string;
    maincategory: string;
    subcategory: string;
    ingredients: string[];
    cleaned_ingredients_list: string[];
    steps: string[];
    serves: number;
    ratings: number;
    vote_count: number;
    score: number;
    url: string;
    nutrients: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    };
    times: {
        prep?: number;
        cook?: number;
    };
}

export interface RecipeResponse {
    matched_recipes: Recipe[];
}

export const pantryApi = {
    getAllItems: async (): Promise<PantryItem[]> => {
        try {
            const response = await api.get('/pantry');
            return response.data;
        } catch (error) {
            console.error('Error fetching pantry items:', error);
            throw error;
        }
    },

    confirmAddItems: async (items: Omit<PantryItem, 'id'>[]): Promise<{ inserted: PantryItem[] }> => {
        try {
            const response = await api.post('/pantry/confirm-add', { items });
            return response.data;
        } catch (error) {
            console.error('Error adding pantry items:', error);
            throw error;
        }
    },

    addItem: async (item: Omit<PantryItem, 'id'>): Promise<PantryItem> => {
        try {
            const response = await api.post('/api/pantry', item);
            return response.data;
        } catch (error) {
            console.error('Error adding pantry item:', error);
            throw error;
        }
    },

    updateItem: async (id: string, item: Partial<PantryItem>): Promise<PantryItem> => {
        try {
            const response = await api.put(`/api/pantry/${id}`, item);
            return response.data;
        } catch (error) {
            console.error('Error updating pantry item:', error);
            throw error;
        }
    },

    deleteItem: async (id: string): Promise<void> => {
        try {
            await api.delete(`/api/pantry/${id}`);
        } catch (error) {
            console.error('Error deleting pantry item:', error);
            throw error;
        }
    },
};

export const recipesApi = {
    matchRecipes: async (k: number = 5): Promise<RecipeResponse> => {
        try {
            const response = await api.get(`/recipes/match?k=${k}`);
            return response.data;
        } catch (error) {
            console.error('Error matching recipes:', error);
            throw error;
        }
    },

    searchByIngredients: async (ingredients: string[]): Promise<{ results: Recipe[] }> => {
        try {
            const response = await api.get('/recipes/search', {
                params: {
                    ingredients: ingredients.join(','),
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    },
}; 