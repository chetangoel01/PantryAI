import axios from 'axios';
import { getDeviceId } from './getDeviceId';
import { logger } from './logger';

const API_BASE_URL = 'https://pantryai.dragonchetan.com';

logger.info(`Initializing API client with base URL: ${API_BASE_URL}`);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout for OCR processing
});

// Request interceptor with detailed logging
api.interceptors.request.use(
    async (config) => {
        const deviceId = await getDeviceId();
        config.headers['X-Device-ID'] = deviceId;
        
        logger.apiCall(config.method || 'GET', config.url || '', {
            headers: config.headers,
            data: config.data,
            params: config.params,
            deviceId: deviceId
        });
        
        return config;
    },
    (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
    }
);

// Response interceptor with detailed logging
api.interceptors.response.use(
    (response) => {
        logger.apiResponse(
            response.config.method || 'GET',
            response.config.url || '',
            response.status,
            response.data
        );
        return response;
    },
    (error) => {
        logger.apiError(
            error.config?.method || 'UNKNOWN',
            error.config?.url || 'UNKNOWN',
            error
        );
        return Promise.reject(error);
    }
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
            logger.info('Fetching all pantry items');
            const response = await api.get('/pantry');
            logger.info(`Successfully fetched ${response.data.length} pantry items`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching pantry items', error);
            throw error;
        }
    },

    confirmAddItems: async (items: Omit<PantryItem, 'id'>[]): Promise<{ inserted: PantryItem[] }> => {
        try {
            logger.info(`Confirming addition of ${items.length} items to pantry`, items);
            const response = await api.post('/pantry/confirm-add', { items });
            logger.info(`Successfully added ${response.data.inserted?.length || 0} items to pantry`);
            return response.data;
        } catch (error) {
            logger.error('Error adding pantry items', error);
            throw error;
        }
    },

    addItem: async (item: Omit<PantryItem, 'id'>): Promise<PantryItem> => {
        try {
            logger.info('Adding single item to pantry', item);
            const response = await api.post('/pantry/confirm-add', { items: [item] });
            logger.info('Successfully added item to pantry', response.data.inserted[0]);
            return response.data.inserted[0];
        } catch (error) {
            logger.error('Error adding pantry item', error);
            throw error;
        }
    },

    updateItem: async (id: string, item: Partial<PantryItem>): Promise<PantryItem> => {
        try {
            logger.info(`Updating pantry item with ID: ${id}`, item);
            const response = await api.put(`/pantry/${id}`, item);
            logger.info('Successfully updated pantry item', response.data);
            return response.data;
        } catch (error) {
            logger.error(`Error updating pantry item ${id}`, error);
            throw error;
        }
    },

    deleteItem: async (id: string): Promise<void> => {
        try {
            logger.info(`Deleting pantry item with ID: ${id}`);
            const response = await api.delete(`/pantry/${id}`);
            logger.info(`Successfully deleted pantry item ${id}`, response.data);
            return response.data;
        } catch (error) {
            logger.error(`Error deleting pantry item ${id}`, error);
            throw error;
        }
    },
};

export const recipesApi = {
    matchRecipes: async (k: number = 5): Promise<RecipeResponse> => {
        try {
            const deviceId = await getDeviceId();
            logger.info(`Matching recipes for device ID: ${deviceId}, k: ${k}`);
            const response = await api.get(`/recipes/match?k=${k}&user_id=${deviceId}`);
            logger.info(`Successfully matched ${response.data.matched_recipes?.length || 0} recipes`);
            return response.data;
        } catch (error) {
            logger.error('Error matching recipes', error);
            throw error;
        }
    },

    searchByIngredients: async (ingredients: string[]): Promise<{ results: Recipe[] }> => {
        try {
            logger.info(`Searching recipes by ingredients: ${ingredients.join(', ')}`);
            const response = await api.get('/recipes/search', {
                params: {
                    ingredients: ingredients.join(','),
                },
            });
            logger.info(`Found ${response.data.results?.length || 0} recipes by ingredients`);
            return response.data;
        } catch (error) {
            logger.error('Error searching recipes by ingredients', error);
            throw error;
        }
    },

    searchRecipes: async (query: string): Promise<{ results: Recipe[] }> => {
        try {
            logger.info(`Searching recipes with query: ${query}`);
            const response = await api.get('/recipes/search', {
                params: { query },
            });
            logger.info(`Found ${response.data.results?.length || 0} recipes by query`);
            return response.data;
        } catch (error) {
            logger.error('Error searching recipes', error);
            throw error;
        }
    },
};

export const scanApi = {
    scanImage: async (parsedText: string[]): Promise<{ parsed_items: PantryItem[] }> => {
        try {
            logger.info(`Scanning image with ${parsedText.length} text lines`, parsedText);
            const apiResponse = await api.post('/scan', {
                parsed_text: parsedText.join('\n')
            });
            logger.info(`Successfully parsed ${apiResponse.data.parsed_items?.length || 0} items from scan`);
            return apiResponse.data;
        } catch (error: any) {
            logger.error('Error scanning image', error);
            if (error.response) {
                logger.error('API error response details', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
                throw new Error(error.response.data.error || 'Failed to process text');
            }
            throw error;
        }
    },
}; 
