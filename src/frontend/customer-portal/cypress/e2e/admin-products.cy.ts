describe('Admin Product Management E2E Tests', () => {
  const adminUser = {
    email: 'admin@climacool.com',
    password: 'Admin123!@#'
  };

  const testProduct = {
    name: 'Test HVAC Filter',
    description: 'High-efficiency particulate air filter for HVAC systems',
    shortDescription: 'High-efficiency HVAC filter',
    sku: 'HVAC-FILTER-001',
    price: 49.99,
    compareAtPrice: 59.99,
    cost: 25.00,
    quantityInStock: 100,
    lowStockThreshold: 10,
    brand: 'ClimaCool',
    weight: 2.5,
    dimensions: '20 x 20 x 1 inches'
  };

  beforeEach(() => {
    // Reset database and seed test data
    cy.task('db:seed');
    
    // Login as admin
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type(adminUser.email);
    cy.get('[data-cy=password-input]').type(adminUser.password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/auth/login');
  });

  describe('Product List Management', () => {
    beforeEach(() => {
      cy.visit('/admin/products');
    });

    it('should display product management dashboard', () => {
      cy.get('[data-cy=admin-products]').should('be.visible');
      cy.contains('Product Management').should('be.visible');
      
      // Check statistics cards
      cy.get('[data-cy=total-products-stat]').should('be.visible');
      cy.get('[data-cy=active-products-stat]').should('be.visible');
      cy.get('[data-cy=low-stock-stat]').should('be.visible');
      cy.get('[data-cy=out-of-stock-stat]').should('be.visible');
    });

    it('should display products in table', () => {
      cy.get('[data-cy=products-table]').should('be.visible');
      cy.get('[data-cy=product-row]').should('have.length.at.least', 1);
      
      // Check table columns
      cy.get('thead').within(() => {
        cy.contains('Product').should('be.visible');
        cy.contains('SKU').should('be.visible');
        cy.contains('Price').should('be.visible');
        cy.contains('Stock').should('be.visible');
        cy.contains('Status').should('be.visible');
        cy.contains('Actions').should('be.visible');
      });
    });

    it('should filter products by search term', () => {
      cy.get('[data-cy=search-input]').type('HVAC');
      cy.get('[data-cy=apply-filters]').click();
      
      cy.get('[data-cy=product-row]').each(($row) => {
        cy.wrap($row).should('contain.text', 'HVAC');
      });
    });

    it('should filter products by status', () => {
      cy.get('[data-cy=status-filter]').select('active');
      
      cy.get('[data-cy=product-status]').each(($status) => {
        cy.wrap($status).should('contain.text', 'Active');
      });
    });

    it('should filter products by stock level', () => {
      cy.get('[data-cy=stock-filter]').select('lowstock');
      
      cy.get('[data-cy=product-stock]').each(($stock) => {
        const stockValue = parseInt($stock.text());
        expect(stockValue).to.be.at.most(10);
      });
    });

    it('should sort products by different columns', () => {
      // Sort by price
      cy.get('[data-cy=sort-price]').click();
      
      let previousPrice = 0;
      cy.get('[data-cy=product-price]').each(($price) => {
        const currentPrice = parseFloat($price.text().replace('$', ''));
        expect(currentPrice).to.be.at.least(previousPrice);
        previousPrice = currentPrice;
      });
    });

    it('should navigate to add new product page', () => {
      cy.get('[data-cy=add-product-button]').click();
      cy.url().should('include', '/admin/products/new');
      cy.contains('Create New Product').should('be.visible');
    });
  });

  describe('Product Creation', () => {
    beforeEach(() => {
      cy.visit('/admin/products/new');
    });

    it('should display product creation form', () => {
      cy.contains('Create New Product').should('be.visible');
      cy.get('[data-cy=product-form]').should('be.visible');
      
      // Check form sections
      cy.contains('Basic Information').should('be.visible');
      cy.contains('Pricing').should('be.visible');
      cy.contains('Inventory').should('be.visible');
      cy.contains('Product Images').should('be.visible');
      cy.contains('Search Engine Optimization').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=save-product-button]').click();
      
      // Check validation errors
      cy.contains('Product name is required').should('be.visible');
      cy.contains('Description is required').should('be.visible');
      cy.contains('SKU is required').should('be.visible');
      cy.contains('Price is required').should('be.visible');
      cy.contains('Category is required').should('be.visible');
    });

    it('should create a new product successfully', () => {
      // Fill basic information
      cy.get('[data-cy=product-name]').type(testProduct.name);
      cy.get('[data-cy=product-description]').type(testProduct.description);
      cy.get('[data-cy=product-short-description]').type(testProduct.shortDescription);
      
      // Fill pricing
      cy.get('[data-cy=product-price]').type(testProduct.price.toString());
      cy.get('[data-cy=product-compare-price]').type(testProduct.compareAtPrice.toString());
      cy.get('[data-cy=product-cost]').type(testProduct.cost.toString());
      
      // Fill inventory
      cy.get('[data-cy=product-sku]').type(testProduct.sku);
      cy.get('[data-cy=product-quantity]').type(testProduct.quantityInStock.toString());
      cy.get('[data-cy=product-low-stock]').type(testProduct.lowStockThreshold.toString());
      
      // Select category
      cy.get('[data-cy=product-category]').select(1);
      
      // Fill additional details
      cy.get('[data-cy=product-brand]').type(testProduct.brand);
      cy.get('[data-cy=product-weight]').type(testProduct.weight.toString());
      cy.get('[data-cy=product-dimensions]').type(testProduct.dimensions);
      
      // Set as active and featured
      cy.get('[data-cy=product-active]').check();
      cy.get('[data-cy=product-featured]').check();
      
      // Add tags
      cy.get('[data-cy=product-tag-input]').type('hvac{enter}');
      cy.get('[data-cy=product-tag-input]').type('filter{enter}');
      cy.get('[data-cy=product-tag-input]').type('air-quality{enter}');
      
      // Save product
      cy.get('[data-cy=save-product-button]').click();
      
      // Verify redirect to products list
      cy.url().should('include', '/admin/products');
      cy.contains(testProduct.name).should('be.visible');
    });

    it('should auto-generate slug from product name', () => {
      cy.get('[data-cy=product-name]').type('Test Product Name');
      cy.get('[data-cy=product-slug]').should('have.value', 'test-product-name');
    });

    it('should handle image upload', () => {
      // Upload image
      cy.fixture('product-image.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      // Verify image preview
      cy.get('[data-cy=image-preview]').should('be.visible');
      cy.get('[data-cy=set-primary-image]').first().click();
      cy.get('[data-cy=primary-badge]').should('be.visible');
    });
  });

  describe('Product Editing', () => {
    it('should load product data for editing', () => {
      cy.visit('/admin/products');
      cy.get('[data-cy=edit-product-button]').first().click();
      
      cy.url().should('match', /\/admin\/products\/[\w-]+\/edit/);
      cy.contains('Edit Product').should('be.visible');
      
      // Verify form is populated
      cy.get('[data-cy=product-name]').should('not.have.value', '');
      cy.get('[data-cy=product-sku]').should('not.have.value', '');
      cy.get('[data-cy=product-price]').should('not.have.value', '0');
    });

    it('should update product successfully', () => {
      cy.visit('/admin/products');
      cy.get('[data-cy=edit-product-button]').first().click();
      
      // Update product name
      cy.get('[data-cy=product-name]').clear().type('Updated Product Name');
      
      // Update price
      cy.get('[data-cy=product-price]').clear().type('99.99');
      
      // Save changes
      cy.get('[data-cy=save-product-button]').click();
      
      // Verify redirect and update
      cy.url().should('include', '/admin/products');
      cy.contains('Updated Product Name').should('be.visible');
      cy.contains('$99.99').should('be.visible');
    });

    it('should duplicate product', () => {
      cy.visit('/admin/products');
      cy.get('[data-cy=duplicate-product-button]').first().click();
      
      cy.url().should('include', '/admin/products/new?duplicate=');
      cy.get('[data-cy=product-name]').should('contain.value', '(Copy)');
      cy.get('[data-cy=product-sku]').should('contain.value', '-COPY');
      cy.get('[data-cy=product-active]').should('not.be.checked');
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      cy.visit('/admin/products');
    });

    it('should enable bulk selection mode', () => {
      cy.get('[data-cy=bulk-select-button]').click();
      cy.get('[data-cy=select-all-checkbox]').should('be.visible');
      cy.get('[data-cy=product-checkbox]').should('be.visible');
    });

    it('should select multiple products', () => {
      cy.get('[data-cy=bulk-select-button]').click();
      cy.get('[data-cy=product-checkbox]').first().check();
      cy.get('[data-cy=product-checkbox]').eq(1).check();
      cy.get('[data-cy=product-checkbox]').eq(2).check();
      
      cy.get('[data-cy=bulk-actions-button]').should('contain', '3');
    });

    it('should bulk update product status', () => {
      cy.get('[data-cy=bulk-select-button]').click();
      cy.get('[data-cy=select-all-checkbox]').check();
      cy.get('[data-cy=bulk-actions-button]').click();
      
      cy.get('[data-cy=bulk-action-modal]').should('be.visible');
      cy.get('[data-cy=bulk-mark-inactive]').click();
      
      // Verify all products marked as inactive
      cy.get('[data-cy=product-status]').each(($status) => {
        cy.wrap($status).should('contain.text', 'Inactive');
      });
    });

    it('should bulk delete products', () => {
      cy.get('[data-cy=bulk-select-button]').click();
      cy.get('[data-cy=product-checkbox]').first().check();
      cy.get('[data-cy=product-checkbox]').eq(1).check();
      
      cy.get('[data-cy=bulk-actions-button]').click();
      cy.get('[data-cy=bulk-delete]').click();
      
      // Confirm deletion
      cy.get('[data-cy=confirm-delete]').click();
      
      // Verify products removed
      cy.get('[data-cy=product-row]').should('have.length.lessThan', 5);
    });
  });

  describe('Inventory Management', () => {
    beforeEach(() => {
      cy.visit('/admin/inventory');
    });

    it('should display inventory management interface', () => {
      cy.contains('Inventory Management').should('be.visible');
      cy.get('[data-cy=inventory-table]').should('be.visible');
      
      // Check statistics
      cy.get('[data-cy=total-skus-stat]').should('be.visible');
      cy.get('[data-cy=in-stock-stat]').should('be.visible');
      cy.get('[data-cy=low-stock-stat]').should('be.visible');
      cy.get('[data-cy=out-of-stock-stat]').should('be.visible');
    });

    it('should update individual product stock', () => {
      cy.get('[data-cy=stock-adjustment-type]').first().select('add');
      cy.get('[data-cy=stock-adjustment-value]').first().type('50');
      cy.get('[data-cy=stock-adjustment-reason]').first().type('New shipment received');
      cy.get('[data-cy=apply-stock-update]').first().click();
      
      // Verify stock updated
      cy.get('[data-cy=current-stock]').first().then(($stock) => {
        const currentStock = parseInt($stock.text());
        cy.get('[data-cy=new-stock]').first().should('contain', currentStock + 50);
      });
    });

    it('should show low stock alerts', () => {
      cy.get('[data-cy=low-stock-alert]').should('be.visible');
      cy.get('[data-cy=low-stock-products]').should('have.length.at.least', 1);
    });

    it('should apply bulk inventory updates', () => {
      cy.get('[data-cy=bulk-update-button]').click();
      cy.get('[data-cy=bulk-update-modal]').should('be.visible');
      
      cy.get('[data-cy=bulk-update-type]').select('setMinimum');
      cy.get('[data-cy=bulk-update-value]').type('20');
      cy.get('[data-cy=bulk-update-scope]').select('lowStock');
      cy.get('[data-cy=bulk-update-reason]').type('Minimum stock level adjustment');
      
      cy.get('[data-cy=apply-bulk-update]').click();
      
      // Verify updates pending
      cy.get('[data-cy=pending-update]').should('have.length.at.least', 1);
    });

    it('should apply all pending updates', () => {
      // Create some pending updates
      cy.get('[data-cy=stock-adjustment-type]').first().select('set');
      cy.get('[data-cy=stock-adjustment-value]').first().type('100');
      cy.get('[data-cy=stock-adjustment-type]').eq(1).select('add');
      cy.get('[data-cy=stock-adjustment-value]').eq(1).type('25');
      
      cy.get('[data-cy=apply-all-updates]').click();
      
      // Verify updates applied
      cy.contains('Updated 2 products successfully').should('be.visible');
      cy.get('[data-cy=pending-update]').should('not.exist');
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      cy.visit('/admin/products');
    });

    it('should show import modal', () => {
      cy.get('[data-cy=import-button]').click();
      cy.get('[data-cy=import-modal]').should('be.visible');
      cy.contains('Import Products from CSV').should('be.visible');
      cy.contains('Download sample CSV').should('be.visible');
    });

    it('should import products from CSV', () => {
      cy.get('[data-cy=import-button]').click();
      
      // Upload CSV file
      cy.fixture('products-import.csv').then(fileContent => {
        cy.get('[data-cy=csv-file-input]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'products-import.csv',
          mimeType: 'text/csv'
        });
      });
      
      cy.get('[data-cy=import-confirm]').click();
      
      // Verify import success
      cy.contains('Import complete').should('be.visible');
      cy.get('[data-cy=import-modal]').should('not.exist');
    });

    it('should export products to CSV', () => {
      cy.get('[data-cy=export-button]').click();
      
      // Verify file download
      cy.readFile('cypress/downloads/products_*.csv').should('exist');
    });

    it('should export filtered products', () => {
      // Apply filters first
      cy.get('[data-cy=status-filter]').select('active');
      cy.get('[data-cy=export-button]').click();
      
      // Verify exported file contains only filtered products
      cy.readFile('cypress/downloads/products_*.csv').then((content) => {
        const lines = content.split('\n');
        expect(lines.length).to.be.greaterThan(1); // Header + at least one product
      });
    });
  });

  describe('Product Images', () => {
    beforeEach(() => {
      cy.visit('/admin/products/new');
    });

    it('should upload multiple images', () => {
      cy.fixture('product-image-1.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image-1.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      cy.fixture('product-image-2.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image-2.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      cy.get('[data-cy=image-preview]').should('have.length', 2);
    });

    it('should set primary image', () => {
      // Upload two images
      cy.fixture('product-image-1.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image-1.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      cy.fixture('product-image-2.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image-2.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      // Set second image as primary
      cy.get('[data-cy=set-primary-image]').eq(1).click();
      cy.get('[data-cy=primary-badge]').eq(1).should('be.visible');
    });

    it('should remove image', () => {
      cy.fixture('product-image.jpg').then(fileContent => {
        cy.get('[data-cy=image-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image.jpg',
          mimeType: 'image/jpeg'
        });
      });
      
      cy.get('[data-cy=remove-image]').first().click();
      cy.get('[data-cy=image-preview]').should('not.exist');
    });

    it('should support drag and drop upload', () => {
      cy.fixture('product-image.jpg').then(fileContent => {
        cy.get('[data-cy=image-drop-zone]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'product-image.jpg',
          mimeType: 'image/jpeg'
        }, { subjectType: 'drag-n-drop' });
      });
      
      cy.get('[data-cy=image-preview]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load product list quickly', () => {
      cy.visit('/admin/products', {
        onBeforeLoad: (win) => {
          win.performance.mark('products-start');
        },
        onLoad: (win) => {
          win.performance.mark('products-end');
          win.performance.measure('products-load', 'products-start', 'products-end');
          const measure = win.performance.getEntriesByName('products-load')[0];
          expect(measure.duration).to.be.lessThan(2000); // Less than 2 seconds
        }
      });
    });

    it('should handle large product lists efficiently', () => {
      // Seed database with many products
      cy.task('db:seedLargeProductSet', { count: 500 });
      cy.visit('/admin/products');
      
      // Verify pagination is working
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=total-pages]').should('contain.text', '25'); // 500 products / 20 per page
      
      // Navigate through pages
      cy.get('[data-cy=next-page]').click();
      cy.get('[data-cy=current-page]').should('contain', '2');
    });
  });

  describe('Access Control', () => {
    it('should require admin role to access product management', () => {
      // Logout admin
      cy.get('[data-cy=logout-button]').click();
      
      // Login as regular user
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('user@example.com');
      cy.get('[data-cy=password-input]').type('User123!@#');
      cy.get('[data-cy=login-button]').click();
      
      // Try to access admin products
      cy.visit('/admin/products');
      
      // Should redirect to unauthorized or home
      cy.url().should('not.include', '/admin/products');
      cy.contains('Unauthorized').should('be.visible');
    });
  });
});