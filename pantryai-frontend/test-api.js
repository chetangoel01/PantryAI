// Simple test script to debug API endpoints
// Run this in your browser console or as a Node.js script

const API_BASE_URL = 'https://pantryai.dragonchetan.com';

// Test function to check API health
async function testAPIHealth() {
    console.log('Testing API health...');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('Health check response:', data);
        return data;
    } catch (error) {
        console.error('Health check failed:', error);
        return null;
    }
}

// Test function to check pantry endpoint
async function testPantryEndpoint() {
    console.log('Testing pantry endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/pantry`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Device-ID': 'test-device-123'
            }
        });
        
        console.log('Pantry response status:', response.status);
        console.log('Pantry response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('Pantry data:', data);
            return data;
        } else {
            const errorData = await response.text();
            console.error('Pantry error response:', errorData);
            return null;
        }
    } catch (error) {
        console.error('Pantry request failed:', error);
        return null;
    }
}

// Test function to check recipes endpoint
async function testRecipesEndpoint() {
    console.log('Testing recipes endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/recipes/match?k=3&user_id=test-device-123`);
        
        console.log('Recipes response status:', response.status);
        console.log('Recipes response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('Recipes data:', data);
            return data;
        } else {
            const errorData = await response.text();
            console.error('Recipes error response:', errorData);
            return null;
        }
    } catch (error) {
        console.error('Recipes request failed:', error);
        return null;
    }
}

// Run all tests
async function runAllTests() {
    console.log('=== Starting API Tests ===');
    
    const health = await testAPIHealth();
    const pantry = await testPantryEndpoint();
    const recipes = await testRecipesEndpoint();
    
    console.log('=== Test Results ===');
    console.log('Health check:', health ? 'PASSED' : 'FAILED');
    console.log('Pantry endpoint:', pantry ? 'PASSED' : 'FAILED');
    console.log('Recipes endpoint:', recipes ? 'PASSED' : 'FAILED');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testAPIHealth = testAPIHealth;
    window.testPantryEndpoint = testPantryEndpoint;
    window.testRecipesEndpoint = testRecipesEndpoint;
    window.runAllTests = runAllTests;
}

// Run tests if this is a Node.js script
if (typeof module !== 'undefined' && module.exports) {
    runAllTests();
} 