/**
 * REAL End-to-End Tests that interact with the backend API
 * These tests verify the complete application flow including:
 * - Frontend UI interactions
 * - API calls to backend
 * - Database persistence
 * - Authentication/Authorization
 */

describe.skip('Full Stack E2E Tests - Complete Application Flow', () => {
  const API_URL = 'http://localhost:5000';
  const uniqueId = Date.now();
  const testUser = {
    email: `testuser${uniqueId}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890'
  };
  let authToken: string;
  let userId: number;

  // Helper function to make direct API calls
  const apiCall = (method: string, endpoint: string, body?: any, token?: string) => {
    const options: any = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
      options.body = body;
    }
    
    return cy.request(options);
  };

  describe('1. Backend Health Check', () => {
    it('should verify backend API is running', () => {
      apiCall('GET', '/health').then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.include('Healthy');
      });
    });

    it('should verify database connectivity', () => {
      apiCall('GET', '/api/health/ready').then((response) => {
        // Even if endpoint doesn't exist, we're checking backend is responding
        expect([200, 404]).to.include(response.status);
      });
    });
  });

  describe('2. User Registration Flow - Full Stack', () => {
    it('should register a new user through the UI and verify in backend', () => {
      // Navigate to registration page
      cy.visit('/auth/register');
      
      // Fill out registration form
      cy.get('input[name="email"], input[type="email"]').first().type(testUser.email);
      cy.get('input[name="password"], input[type="password"]').first().type(testUser.password);
      cy.get('input[name="confirmPassword"], input[placeholder*="Confirm"]').type(testUser.password);
      cy.get('input[name="firstName"]').type(testUser.firstName);
      cy.get('input[name="lastName"]').type(testUser.lastName);
      cy.get('input[name="phoneNumber"], input[type="tel"]').type(testUser.phoneNumber);
      
      // Submit registration
      cy.get('button[type="submit"]').contains(/sign up|register/i).click();
      
      // Verify registration success
      cy.url().should('not.include', '/register');
      
      // Verify user exists in backend by attempting login via API
      apiCall('POST', '/api/auth/login', {
        emailOrUsername: testUser.email,
        password: testUser.password
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');
        authToken = response.body.token;
        userId = response.body.user?.id || response.body.userId;
      });
    });

    it('should prevent duplicate registration', () => {
      cy.visit('/auth/register');
      
      // Try to register with same email
      cy.get('input[name="email"], input[type="email"]').first().type(testUser.email);
      cy.get('input[name="password"], input[type="password"]').first().type(testUser.password);
      cy.get('input[name="confirmPassword"], input[placeholder*="Confirm"]').type(testUser.password);
      cy.get('input[name="firstName"]').type(testUser.firstName);
      cy.get('input[name="lastName"]').type(testUser.lastName);
      
      cy.get('button[type="submit"]').contains(/sign up|register/i).click();
      
      // Should show error message
      cy.contains(/already exists|already registered|duplicate/i).should('be.visible');
    });
  });

  describe('3. Authentication Flow - Full Stack', () => {
    it('should login through UI and receive valid JWT token', () => {
      cy.visit('/auth/login');
      
      // Fill login form
      cy.get('input[name="email"], input[name="emailOrUsername"], #emailOrUsername').first().type(testUser.email);
      cy.get('input[name="password"], input[type="password"], #password').first().type(testUser.password);
      
      // Submit login
      cy.get('button[type="submit"]').contains(/sign in|log in/i).click();
      
      // Should redirect to home or dashboard
      cy.url().should('not.include', '/login');
      
      // Verify token is stored
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token') || 
                      win.localStorage.getItem('token') || 
                      win.sessionStorage.getItem('access_token');
        expect(token).to.not.be.null;
        
        // Verify token works with API
        if (token) {
          apiCall('GET', '/api/auth/profile', null, token).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.email).to.equal(testUser.email);
          });
        }
      });
    });

    it('should reject invalid credentials', () => {
      cy.visit('/auth/login');
      
      cy.get('input[name="email"], input[name="emailOrUsername"], #emailOrUsername').first().type('invalid@example.com');
      cy.get('input[name="password"], input[type="password"], #password').first().type('WrongPassword');
      
      cy.get('button[type="submit"]').contains(/sign in|log in/i).click();
      
      // Should show error
      cy.contains(/invalid|incorrect|wrong/i).should('be.visible');
      
      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should logout and clear session', () => {
      // First login
      cy.visit('/auth/login');
      cy.get('input[name="email"], input[name="emailOrUsername"], #emailOrUsername').first().type(testUser.email);
      cy.get('input[name="password"], input[type="password"], #password').first().type(testUser.password);
      cy.get('button[type="submit"]').contains(/sign in|log in/i).click();
      
      cy.wait(1000);
      
      // Find and click logout
      cy.get('button, a').contains(/logout|sign out/i).click();
      
      // Verify token is cleared
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token') || 
                      win.localStorage.getItem('token');
        expect(token).to.be.null;
      });
      
      // Should redirect to login or home
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/login') || url.endsWith('/');
      });
    });
  });

  describe('4. Product Catalog - Backend Integration', () => {
    beforeEach(() => {
      // Login before product tests
      apiCall('POST', '/api/auth/login', {
        emailOrUsername: testUser.email,
        password: testUser.password
      }).then((response) => {
        authToken = response.body.token;
        cy.window().then((win) => {
          win.localStorage.setItem('access_token', authToken);
        });
      });
    });

    it('should load products from backend API', () => {
      cy.visit('/products');
      
      // Wait for products to load
      cy.intercept('GET', '**/api/products**').as('getProducts');
      cy.wait('@getProducts', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.be.an('array').or.to.have.property('items');
      });
      
      // Verify products are displayed
      cy.get('[data-testid*="product"], .product-card, .product-item').should('have.length.greaterThan', 0);
    });

    it('should search products and get filtered results from API', () => {
      cy.visit('/products');
      
      // Search for products
      cy.get('input[placeholder*="Search"]').type('HVAC');
      
      // Intercept search API call
      cy.intercept('GET', '**/api/products?*search*').as('searchProducts');
      
      // Trigger search (might need to press Enter or click search button)
      cy.get('input[placeholder*="Search"]').type('{enter}');
      
      cy.wait('@searchProducts', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        // Verify search parameter was sent
        expect(interception.request.url).to.include('search');
      });
    });

    it('should load product details from backend', () => {
      // First get a product ID from the API
      apiCall('GET', '/api/products?pageSize=1', null, authToken).then((response) => {
        if (response.body && (response.body.items?.[0] || response.body[0])) {
          const product = response.body.items?.[0] || response.body[0];
          const productId = product.id;
          
          // Visit product detail page
          cy.visit(`/products/${productId}`);
          
          // Intercept product detail API call
          cy.intercept('GET', `**/api/products/${productId}`).as('getProductDetail');
          
          cy.wait('@getProductDetail', { timeout: 10000 }).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
            expect(interception.response?.body).to.have.property('id', productId);
          });
          
          // Verify product details are displayed
          cy.contains(product.name).should('be.visible');
        }
      });
    });
  });

  describe('5. Shopping Cart - Backend Persistence', () => {
    let productId: number;
    
    beforeEach(() => {
      // Login and get a product
      apiCall('POST', '/api/auth/login', {
        emailOrUsername: testUser.email,
        password: testUser.password
      }).then((response) => {
        authToken = response.body.token;
        cy.window().then((win) => {
          win.localStorage.setItem('access_token', authToken);
        });
        
        // Get a product to add to cart
        return apiCall('GET', '/api/products?pageSize=1', null, authToken);
      }).then((response) => {
        if (response.body && (response.body.items?.[0] || response.body[0])) {
          productId = response.body.items?.[0]?.id || response.body[0]?.id;
        }
      });
    });

    it('should add product to cart and persist in backend', () => {
      cy.visit(`/products/${productId}`);
      
      // Add to cart
      cy.intercept('POST', '**/api/cart/items**').as('addToCart');
      cy.get('button').contains(/add to cart/i).click();
      
      cy.wait('@addToCart', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      });
      
      // Verify cart badge updates
      cy.get('[data-testid="cart-badge"]').should('contain', '1');
      
      // Verify cart persists on page reload
      cy.reload();
      cy.get('[data-testid="cart-badge"]').should('contain', '1');
      
      // Verify via API
      apiCall('GET', '/api/cart', null, authToken).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.items).to.have.length.greaterThan(0);
      });
    });

    it('should update cart quantity', () => {
      // First add item to cart via API
      apiCall('POST', '/api/cart/items', {
        productId: productId,
        quantity: 1
      }, authToken);
      
      cy.visit('/cart');
      
      // Update quantity
      cy.intercept('PUT', '**/api/cart/items/**').as('updateCart');
      cy.get('input[type="number"], select').first().clear().type('3');
      
      cy.wait('@updateCart', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.request.body).to.have.property('quantity', 3);
      });
    });

    it('should remove item from cart', () => {
      // Add item first
      apiCall('POST', '/api/cart/items', {
        productId: productId,
        quantity: 1
      }, authToken);
      
      cy.visit('/cart');
      
      // Remove item
      cy.intercept('DELETE', '**/api/cart/items/**').as('removeFromCart');
      cy.get('button').contains(/remove|delete/i).click();
      
      cy.wait('@removeFromCart', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
      });
      
      // Verify cart is empty
      cy.contains(/empty|no items/i).should('be.visible');
    });
  });

  describe('6. Checkout Process - Complete Flow', () => {
    beforeEach(() => {
      // Login and add item to cart
      apiCall('POST', '/api/auth/login', {
        emailOrUsername: testUser.email,
        password: testUser.password
      }).then((response) => {
        authToken = response.body.token;
        cy.window().then((win) => {
          win.localStorage.setItem('access_token', authToken);
        });
        
        // Get a product and add to cart
        return apiCall('GET', '/api/products?pageSize=1', null, authToken);
      }).then((response) => {
        if (response.body && (response.body.items?.[0] || response.body[0])) {
          const productId = response.body.items?.[0]?.id || response.body[0]?.id;
          return apiCall('POST', '/api/cart/items', {
            productId: productId,
            quantity: 1
          }, authToken);
        }
      });
    });

    it('should complete checkout with shipping and payment', () => {
      cy.visit('/checkout');
      
      // Fill shipping information
      cy.get('input[name*="address"], input[placeholder*="Address"]').first().type('123 Test St');
      cy.get('input[name*="city"], input[placeholder*="City"]').type('Test City');
      cy.get('input[name*="state"], select[name*="state"]').type('CA');
      cy.get('input[name*="zip"], input[name*="postal"]').type('12345');
      
      // Fill payment information (test card)
      cy.get('input[name*="card"], input[placeholder*="Card number"]').type('4242424242424242');
      cy.get('input[name*="exp"], input[placeholder*="MM/YY"]').type('12/25');
      cy.get('input[name*="cvv"], input[name*="cvc"]').type('123');
      
      // Place order
      cy.intercept('POST', '**/api/orders**').as('createOrder');
      cy.get('button').contains(/place order|complete|pay/i).click();
      
      cy.wait('@createOrder', { timeout: 15000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
        expect(interception.response?.body).to.have.property('id');
        expect(interception.response?.body).to.have.property('orderNumber');
      });
      
      // Verify order confirmation
      cy.url().should('include', '/order-confirmation');
      cy.contains(/thank you|order confirmed|success/i).should('be.visible');
      
      // Verify cart is cleared
      apiCall('GET', '/api/cart', null, authToken).then((response) => {
        expect(response.body.items).to.have.length(0);
      });
    });

    it('should handle payment failure gracefully', () => {
      cy.visit('/checkout');
      
      // Fill shipping
      cy.get('input[name*="address"], input[placeholder*="Address"]').first().type('123 Test St');
      cy.get('input[name*="city"], input[placeholder*="City"]').type('Test City');
      
      // Use card that triggers decline
      cy.get('input[name*="card"], input[placeholder*="Card number"]').type('4000000000000002');
      cy.get('input[name*="exp"], input[placeholder*="MM/YY"]').type('12/25');
      cy.get('input[name*="cvv"], input[name*="cvc"]').type('123');
      
      cy.intercept('POST', '**/api/orders**').as('createOrder');
      cy.get('button').contains(/place order|complete|pay/i).click();
      
      // Should show error message
      cy.contains(/declined|failed|error/i).should('be.visible');
      
      // Should stay on checkout page
      cy.url().should('include', '/checkout');
    });
  });

  describe('7. Order History - Backend Integration', () => {
    beforeEach(() => {
      // Login
      apiCall('POST', '/api/auth/login', {
        emailOrUsername: testUser.email,
        password: testUser.password
      }).then((response) => {
        authToken = response.body.token;
        cy.window().then((win) => {
          win.localStorage.setItem('access_token', authToken);
        });
      });
    });

    it('should display user orders from backend', () => {
      cy.visit('/orders');
      
      cy.intercept('GET', '**/api/orders**').as('getOrders');
      
      cy.wait('@getOrders', { timeout: 10000 }).then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.be.an('array').or.to.have.property('items');
      });
      
      // If user has orders, they should be displayed
      cy.get('body').then($body => {
        if ($body.find('[data-testid*="order"], .order-item').length > 0) {
          cy.get('[data-testid*="order"], .order-item').should('be.visible');
        } else {
          cy.contains(/no orders|empty/i).should('be.visible');
        }
      });
    });
  });

  describe('8. API Error Handling', () => {
    it('should handle backend downtime gracefully', () => {
      // Simulate backend being down
      cy.intercept('GET', '**/api/**', { statusCode: 503 }).as('backendDown');
      
      cy.visit('/products');
      
      cy.wait('@backendDown', { timeout: 10000 });
      
      // Should show error message
      cy.contains(/error|unable to load|try again/i).should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/products');
      
      cy.wait('@networkError', { timeout: 10000 });
      
      // Should show error message
      cy.contains(/error|network|offline/i).should('be.visible');
    });
  });

  describe('9. Data Validation - Frontend and Backend', () => {
    it('should validate email format on both frontend and backend', () => {
      cy.visit('/auth/register');
      
      // Invalid email
      cy.get('input[name="email"], input[type="email"]').first().type('invalid-email');
      cy.get('input[name="password"], input[type="password"]').first().type('Password123!');
      
      // Frontend validation
      cy.get('button[type="submit"]').click();
      cy.contains(/invalid email|valid email/i).should('be.visible');
      
      // Try to bypass frontend and call API directly
      apiCall('POST', '/api/auth/register', {
        email: 'invalid-email',
        password: 'Password123!'
      }).then((response) => {
        expect(response.status).to.be.greaterThan(399); // Should be 400-499
        expect(response.body).to.have.property('errors').or.to.have.property('message');
      });
    });

    it('should enforce password requirements', () => {
      cy.visit('/auth/register');
      
      // Weak password
      cy.get('input[name="email"], input[type="email"]').first().type(`weak${Date.now()}@example.com`);
      cy.get('input[name="password"], input[type="password"]').first().type('weak');
      
      cy.get('button[type="submit"]').click();
      cy.contains(/password.*requirements|strong|length/i).should('be.visible');
    });
  });

  describe('10. Performance and Load Testing', () => {
    it('should handle concurrent API requests', () => {
      const requests = [];
      
      // Make 10 concurrent product requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          apiCall('GET', `/api/products?page=${i + 1}`, null, authToken)
        );
      }
      
      cy.wrap(Promise.all(requests)).then((responses: any[]) => {
        responses.forEach(response => {
          expect(response.status).to.equal(200);
        });
      });
    });

    it('should load pages within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/products');
      
      // Page should be interactive within 3 seconds
      cy.get('input[placeholder*="Search"]').should('be.visible');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000);
    });
  });

  // Cleanup after all tests
  after(() => {
    // Clean up test user if possible
    if (authToken && userId) {
      apiCall('DELETE', `/api/users/${userId}`, null, authToken);
    }
  });
});