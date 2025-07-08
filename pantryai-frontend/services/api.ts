import axios from 'axios';
import { getDeviceId } from './getDeviceId';

const API_BASE_URL = 'https://pantryai.dragonchetan.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach device_id to each request
api.interceptors.request.use(
    async (config) => {
        const deviceId = await getDeviceId();
        config.headers['X-Device-ID'] = deviceId;
        return config;
    },
    (error) => Promise.reject(error)
);


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
    image_url?: string;
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
    image_url: string;
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
            const response = await api.post('/pantry/confirm-add', { items: [item] });
            return response.data.inserted[0];
        } catch (error) {
            console.error('Error adding pantry item:', error);
            throw error;
        }
    },

    updateItem: async (id: string, item: Partial<PantryItem>): Promise<PantryItem> => {
        try {
            const response = await api.put(`/pantry/${id}`, item);
            return response.data;
        } catch (error) {
            console.error('Error updating pantry item:', error);
            throw error;
        }
    },

    deleteItem: async (id: string): Promise<void> => {
        try {
            // console.log('Attempting to delete item with ID:', id);
            const response = await api.delete(`/pantry/${id}`);
            // console.log('Delete response:', response.data);
            return response.data;
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

    searchRecipes: async (query: string): Promise<{ results: Recipe[] }> => {
        try {
            const response = await api.get('/recipes/search', {
                params: { query },
            });
            return response.data;
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    },
};

export const scanApi = {
    scanImage: async (parsedText: string[]): Promise<{ parsed_items: PantryItem[] }> => {
        try {
            const apiResponse = await api.post('/scan', {
                parsed_text: parsedText.join('\n')
            });
            // console.log('Scan API response:', apiResponse.data);
            return apiResponse.data;
        } catch (error: any) {
            console.error('Error scanning image:', error);
            if (error.response) {
                console.error('API error response:', error.response.data);
                throw new Error(error.response.data.error || 'Failed to process text');
            }
            throw error;
        }
    },
}; 
