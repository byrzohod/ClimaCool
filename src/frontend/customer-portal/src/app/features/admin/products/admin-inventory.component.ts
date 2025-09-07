import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminProductService, Product, InventoryUpdateDto, ProductFilterRequest } from './services/admin-product.service';

interface InventoryItem extends Product {
  pendingUpdate?: number;
  adjustmentType?: 'set' | 'add' | 'subtract';
  updateReason?: string;
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p class="text-gray-600 mt-2">Track and update product inventory levels</p>
          </div>
          <div class="flex space-x-3">
            <button 
              (click)="showBulkUpdate = true"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Bulk Update
            </button>
            <button 
              (click)="applyPendingUpdates()"
              [disabled]="!hasPendingUpdates()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Updates ({{ getPendingCount() }})
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total SKUs</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalProducts }}</p>
              </div>
              <div class="bg-blue-100 rounded-full p-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">In Stock</p>
                <p class="text-2xl font-bold text-green-600">{{ inStockCount }}</p>
              </div>
              <div class="bg-green-100 rounded-full p-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Low Stock</p>
                <p class="text-2xl font-bold text-yellow-600">{{ lowStockCount }}</p>
              </div>
              <div class="bg-yellow-100 rounded-full p-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Out of Stock</p>
                <p class="text-2xl font-bold text-red-600">{{ outOfStockCount }}</p>
              </div>
              <div class="bg-red-100 rounded-full p-3">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (keyup)="filterProducts()"
                placeholder="SKU or product name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select 
                [(ngModel)]="stockFilter"
                (change)="filterProducts()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                <option value="instock">In Stock</option>
                <option value="lowstock">Low Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                [(ngModel)]="categoryFilter"
                (change)="filterProducts()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Show Only</label>
              <select 
                [(ngModel)]="showOnlyFilter"
                (change)="filterProducts()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                <option value="pending">With Pending Updates</option>
                <option value="critical">Critical Stock</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let item of filteredProducts" 
                    [class.bg-yellow-50]="item.pendingUpdate !== undefined">
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <img 
                        [src]="getProductImage(item)" 
                        [alt]="item.name"
                        class="w-10 h-10 object-cover rounded-lg mr-3"
                      >
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                        <p class="text-xs text-gray-500">{{ item.categoryName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ item.sku }}</td>
                  <td class="px-6 py-4">
                    <span [class]="getStockClass(item.quantityInStock, item.lowStockThreshold)" 
                          class="px-2 py-1 text-xs rounded-full font-medium">
                      {{ item.quantityInStock }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                      <select 
                        [(ngModel)]="item.adjustmentType"
                        (change)="updatePendingStock(item)"
                        class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="set">Set to</option>
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                      </select>
                      <input 
                        type="number"
                        [(ngModel)]="item.pendingUpdate"
                        (ngModelChange)="updatePendingStock(item)"
                        min="0"
                        class="w-20 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span *ngIf="item.pendingUpdate !== undefined" 
                          [class]="getStockClass(getNewStock(item), item.lowStockThreshold)"
                          class="px-2 py-1 text-xs rounded-full font-medium">
                      {{ getNewStock(item) }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <input 
                      type="text"
                      [(ngModel)]="item.updateReason"
                      placeholder="Optional reason..."
                      class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="flex space-x-2">
                      <button 
                        *ngIf="item.pendingUpdate !== undefined"
                        (click)="applyUpdate(item)"
                        class="text-green-600 hover:text-green-900"
                      >
                        Apply
                      </button>
                      <button 
                        *ngIf="item.pendingUpdate !== undefined"
                        (click)="clearUpdate(item)"
                        class="text-red-600 hover:text-red-900"
                      >
                        Clear
                      </button>
                      <button 
                        [routerLink]="['/admin/products', item.id, 'edit']"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredProducts.length === 0 && !loading" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>

          <!-- Loading State -->
          <div *ngIf="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-600">Loading inventory...</p>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div *ngIf="lowStockProducts.length > 0" class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>The following products are running low on stock:</p>
                <ul class="list-disc list-inside mt-2">
                  <li *ngFor="let product of lowStockProducts.slice(0, 5)">
                    {{ product.name }} (SKU: {{ product.sku }}) - {{ product.quantityInStock }} remaining
                  </li>
                </ul>
                <p *ngIf="lowStockProducts.length > 5" class="mt-2">
                  And {{ lowStockProducts.length - 5 }} more...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Update Modal -->
    <div *ngIf="showBulkUpdate" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Bulk Inventory Update</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
            <select 
              [(ngModel)]="bulkUpdateType"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="add">Add to all</option>
              <option value="subtract">Subtract from all</option>
              <option value="percentage">Adjust by percentage</option>
              <option value="setMinimum">Set minimum stock</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <input 
              type="number"
              [(ngModel)]="bulkUpdateValue"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Apply to</label>
            <select 
              [(ngModel)]="bulkUpdateScope"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All products</option>
              <option value="filtered">Filtered products only</option>
              <option value="lowStock">Low stock products</option>
              <option value="outOfStock">Out of stock products</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <input 
              type="text"
              [(ngModel)]="bulkUpdateReason"
              placeholder="e.g., Annual inventory count"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
        </div>

        <div class="flex space-x-3 mt-6">
          <button 
            (click)="applyBulkUpdate()"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Update
          </button>
          <button 
            (click)="showBulkUpdate = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminInventoryComponent implements OnInit {
  products: InventoryItem[] = [];
  filteredProducts: InventoryItem[] = [];
  lowStockProducts: Product[] = [];
  categories: string[] = [];
  
  // Stats
  totalProducts = 0;
  inStockCount = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  
  // Filters
  searchTerm = '';
  stockFilter = '';
  categoryFilter = '';
  showOnlyFilter = '';
  
  // Bulk update
  showBulkUpdate = false;
  bulkUpdateType = 'add';
  bulkUpdateValue = 0;
  bulkUpdateScope = 'all';
  bulkUpdateReason = '';
  
  loading = false;

  constructor(private productService: AdminProductService) {}

  ngOnInit() {
    this.loadInventory();
    this.loadLowStockProducts();
  }

  loadInventory() {
    this.loading = true;
    const filter: ProductFilterRequest = {
      pageSize: 1000, // Load all products for inventory management
      sortBy: 'stock',
      sortDescending: false
    };

    this.productService.getProducts(filter).subscribe({
      next: (result) => {
        this.products = result.items.map(p => ({
          ...p,
          adjustmentType: 'set' as 'set'
        }));
        this.filteredProducts = [...this.products];
        this.updateStats();
        this.extractCategories();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });
  }

  loadLowStockProducts() {
    this.productService.getLowStockProducts().subscribe({
      next: (products) => {
        this.lowStockProducts = products;
      },
      error: (err) => {
        console.error('Error loading low stock products:', err);
      }
    });
  }

  updateStats() {
    this.totalProducts = this.products.length;
    this.inStockCount = this.products.filter(p => p.quantityInStock > p.lowStockThreshold).length;
    this.lowStockCount = this.products.filter(p => p.quantityInStock > 0 && p.quantityInStock <= p.lowStockThreshold).length;
    this.outOfStockCount = this.products.filter(p => p.quantityInStock === 0).length;
  }

  extractCategories() {
    const cats = new Set(this.products.map(p => p.categoryName).filter(c => c));
    this.categories = Array.from(cats) as string[];
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      // Search filter
      if (this.searchTerm && 
          !product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
          !product.sku.toLowerCase().includes(this.searchTerm.toLowerCase())) {
        return false;
      }

      // Stock filter
      if (this.stockFilter) {
        if (this.stockFilter === 'instock' && product.quantityInStock <= product.lowStockThreshold) return false;
        if (this.stockFilter === 'lowstock' && (product.quantityInStock === 0 || product.quantityInStock > product.lowStockThreshold)) return false;
        if (this.stockFilter === 'outofstock' && product.quantityInStock !== 0) return false;
      }

      // Category filter
      if (this.categoryFilter && product.categoryName !== this.categoryFilter) {
        return false;
      }

      // Show only filter
      if (this.showOnlyFilter) {
        if (this.showOnlyFilter === 'pending' && product.pendingUpdate === undefined) return false;
        if (this.showOnlyFilter === 'critical' && product.quantityInStock > 5) return false;
      }

      return true;
    });
  }

  updatePendingStock(item: InventoryItem) {
    // Trigger change detection
    this.filteredProducts = [...this.filteredProducts];
  }

  getNewStock(item: InventoryItem): number {
    if (item.pendingUpdate === undefined) return item.quantityInStock;
    
    switch (item.adjustmentType) {
      case 'set':
        return item.pendingUpdate;
      case 'add':
        return item.quantityInStock + item.pendingUpdate;
      case 'subtract':
        return Math.max(0, item.quantityInStock - item.pendingUpdate);
      default:
        return item.quantityInStock;
    }
  }

  applyUpdate(item: InventoryItem) {
    if (item.pendingUpdate === undefined) return;

    const update: InventoryUpdateDto = {
      productId: item.id,
      quantity: item.pendingUpdate,
      adjustmentType: item.adjustmentType || 'set',
      reason: item.updateReason
    };

    this.productService.updateInventory([update]).subscribe({
      next: (result) => {
        if (result.successCount > 0) {
          // Update local data
          item.quantityInStock = this.getNewStock(item);
          item.pendingUpdate = undefined;
          item.updateReason = '';
          this.updateStats();
        }
      },
      error: (err) => {
        console.error('Error updating inventory:', err);
      }
    });
  }

  clearUpdate(item: InventoryItem) {
    item.pendingUpdate = undefined;
    item.updateReason = '';
  }

  hasPendingUpdates(): boolean {
    return this.products.some(p => p.pendingUpdate !== undefined);
  }

  getPendingCount(): number {
    return this.products.filter(p => p.pendingUpdate !== undefined).length;
  }

  applyPendingUpdates() {
    const updates: InventoryUpdateDto[] = this.products
      .filter(p => p.pendingUpdate !== undefined)
      .map(p => ({
        productId: p.id,
        quantity: p.pendingUpdate!,
        adjustmentType: p.adjustmentType || 'set',
        reason: p.updateReason
      }));

    if (updates.length === 0) return;

    this.productService.updateInventory(updates).subscribe({
      next: (result) => {
        // Clear pending updates for successful items
        this.products.forEach(p => {
          if (p.pendingUpdate !== undefined) {
            p.quantityInStock = this.getNewStock(p);
            p.pendingUpdate = undefined;
            p.updateReason = '';
          }
        });
        this.updateStats();
        alert(`Updated ${result.successCount} products successfully`);
      },
      error: (err) => {
        console.error('Error applying updates:', err);
      }
    });
  }

  applyBulkUpdate() {
    let productsToUpdate: InventoryItem[] = [];
    
    switch (this.bulkUpdateScope) {
      case 'all':
        productsToUpdate = this.products;
        break;
      case 'filtered':
        productsToUpdate = this.filteredProducts;
        break;
      case 'lowStock':
        productsToUpdate = this.products.filter(p => p.quantityInStock > 0 && p.quantityInStock <= p.lowStockThreshold);
        break;
      case 'outOfStock':
        productsToUpdate = this.products.filter(p => p.quantityInStock === 0);
        break;
    }

    productsToUpdate.forEach(product => {
      product.adjustmentType = this.bulkUpdateType === 'add' || this.bulkUpdateType === 'subtract' ? this.bulkUpdateType : 'set';
      
      switch (this.bulkUpdateType) {
        case 'add':
        case 'subtract':
          product.pendingUpdate = this.bulkUpdateValue;
          break;
        case 'percentage':
          product.pendingUpdate = Math.round(product.quantityInStock * (1 + this.bulkUpdateValue / 100));
          product.adjustmentType = 'set';
          break;
        case 'setMinimum':
          if (product.quantityInStock < this.bulkUpdateValue) {
            product.pendingUpdate = this.bulkUpdateValue;
            product.adjustmentType = 'set';
          }
          break;
      }
      
      product.updateReason = this.bulkUpdateReason;
    });

    this.showBulkUpdate = false;
    this.filterProducts();
  }

  getProductImage(product: Product): string {
    const primaryImage = product.images?.find(i => i.isPrimary);
    return primaryImage?.url || 'assets/images/product-placeholder.png';
  }

  getStockClass(quantity: number, threshold: number): string {
    if (quantity === 0) {
      return 'bg-red-100 text-red-800';
    } else if (quantity <= threshold) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }
}