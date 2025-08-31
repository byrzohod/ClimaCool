import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '3m', target: 50 },   // Ramp down to 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],               // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Helper function to handle responses
function handleResponse(response, expectedStatus = 200) {
  const success = check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  return success;
}

export default function () {
  // Test different API endpoints
  
  group('Public Endpoints', () => {
    // Get products
    let productsResponse = http.get(`${BASE_URL}/api/products?page=1&limit=20`);
    handleResponse(productsResponse);
    
    sleep(1);
    
    // Get categories
    let categoriesResponse = http.get(`${BASE_URL}/api/categories`);
    handleResponse(categoriesResponse);
    
    sleep(1);
    
    // Search products
    let searchResponse = http.get(`${BASE_URL}/api/search?q=laptop`);
    handleResponse(searchResponse);
    
    sleep(2);
  });
  
  group('Authentication Flow', () => {
    // Register new user
    const uniqueEmail = `test${Date.now()}${Math.random()}@example.com`;
    const registerPayload = JSON.stringify({
      email: uniqueEmail,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    });
    
    const registerParams = {
      headers: { 'Content-Type': 'application/json' },
    };
    
    let registerResponse = http.post(
      `${BASE_URL}/api/auth/register`,
      registerPayload,
      registerParams
    );
    
    // Registration might fail if email exists, that's okay
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      handleResponse(registerResponse, registerResponse.status);
      
      // Login with registered user
      const loginPayload = JSON.stringify({
        email: uniqueEmail,
        password: 'Test123!@#',
      });
      
      let loginResponse = http.post(
        `${BASE_URL}/api/auth/login`,
        loginPayload,
        registerParams
      );
      
      if (handleResponse(loginResponse)) {
        const token = loginResponse.json('token');
        
        // Make authenticated request
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };
        
        let profileResponse = http.get(`${BASE_URL}/api/auth/me`, authParams);
        handleResponse(profileResponse);
      }
    }
    
    sleep(2);
  });
  
  group('Shopping Cart Operations', () => {
    // Get cart (creates new if doesn't exist)
    let cartResponse = http.get(`${BASE_URL}/api/cart`);
    
    if (handleResponse(cartResponse)) {
      // Add item to cart
      const addToCartPayload = JSON.stringify({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
      });
      
      const params = {
        headers: { 'Content-Type': 'application/json' },
      };
      
      let addResponse = http.post(
        `${BASE_URL}/api/cart/items`,
        addToCartPayload,
        params
      );
      
      // Adding to cart might fail if product doesn't exist
      if (addResponse.status === 200 || addResponse.status === 201) {
        handleResponse(addResponse, addResponse.status);
      }
    }
    
    sleep(1);
  });
  
  // Random think time between iterations
  sleep(Math.random() * 3 + 1);
}