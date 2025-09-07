import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminProductService, Product, ProductFilterRequest, BulkUpdateDto, ProductStatistics } from './services/admin-product.service';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Product Management</h1>
            <p class="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <div class="flex space-x-3">
            <button 
              (click)="showImportModal = true"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Import CSV
              </span>
            </button>
            <button 
              (click)="exportProducts()"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export CSV
              </span>
            </button>
            <button 
              routerLink="/admin/products/new"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Product
              </span>
            </button>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Products</p>
                <p class="text-2xl font-bold text-gray-900">{{ statistics.totalProducts || 0 }}</p>
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
                <p class="text-sm font-medium text-gray-600">Active Products</p>
                <p class="text-2xl font-bold text-green-600">{{ statistics.activeProducts || 0 }}</p>
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
                <p class="text-2xl font-bold text-yellow-600">{{ statistics.lowStock || 0 }}</p>
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
                <p class="text-2xl font-bold text-red-600">{{ statistics.outOfStock || 0 }}</p>
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
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input 
                type="text"
                [(ngModel)]="filter.searchTerm"
                (keyup.enter)="applyFilters()"
                placeholder="Product name, SKU..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                [(ngModel)]="statusFilter"
                (change)="applyStatusFilter()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="featured">Featured Only</option>
              </select>
            </div>

            <!-- Stock Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select 
                [(ngModel)]="stockFilter"
                (change)="applyStockFilter()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stock Levels</option>
                <option value="instock">In Stock</option>
                <option value="lowstock">Low Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>

            <!-- Sort -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                [(ngModel)]="filter.sortBy"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="created">Date Created</option>
                <option value="updated">Last Updated</option>
              </select>
            </div>
          </div>

          <div class="flex justify-between items-center mt-4">
            <button 
              (click)="resetFilters()"
              class="text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
            <div class="flex space-x-2">
              <button 
                (click)="toggleBulkSelect()"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {{ bulkSelectMode ? 'Cancel Selection' : 'Bulk Select' }}
              </button>
              <button 
                *ngIf="selectedProducts.length > 0"
                (click)="showBulkActions = true"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bulk Actions ({{ selectedProducts.length }})
              </button>
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th *ngIf="bulkSelectMode" class="px-6 py-3 text-left">
                    <input 
                      type="checkbox"
                      [checked]="isAllSelected()"
                      (change)="toggleSelectAll()"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let product of products" [class.bg-gray-50]="isSelected(product.id)">
                  <td *ngIf="bulkSelectMode" class="px-6 py-4">
                    <input 
                      type="checkbox"
                      [checked]="isSelected(product.id)"
                      (change)="toggleSelect(product.id)"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <img 
                        [src]="getProductImage(product)" 
                        [alt]="product.name"
                        class="w-10 h-10 object-cover rounded-lg mr-3"
                      >
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                        <p class="text-xs text-gray-500">{{ product.categoryName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ product.sku }}</td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{{ product.price | currency }}</div>
                    <div *ngIf="product.compareAtPrice" class="text-xs text-gray-500 line-through">
                      {{ product.compareAtPrice | currency }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="getStockClass(product)" class="px-2 py-1 text-xs rounded-full font-medium">
                      {{ product.quantityInStock }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                      <span [class]="product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" 
                        class="px-2 py-1 text-xs rounded-full font-medium">
                        {{ product.isActive ? 'Active' : 'Inactive' }}
                      </span>
                      <span *ngIf="product.isFeatured" class="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full font-medium">
                        Featured
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                      <button 
                        [routerLink]="['/admin/products', product.id, 'edit']"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        (click)="duplicateProduct(product)"
                        class="text-green-600 hover:text-green-900"
                      >
                        Duplicate
                      </button>
                      <button 
                        (click)="deleteProduct(product)"
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div *ngIf="products.length === 0 && !loading" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
            <div class="mt-6">
              <button 
                routerLink="/admin/products/new"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-600">Loading products...</p>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ ((filter.pageNumber || 1) - 1) * (filter.pageSize || 10) + 1 }} to 
              {{ Math.min((filter.pageNumber || 1) * (filter.pageSize || 10), totalCount) }} of 
              {{ totalCount }} products
            </div>
            <div class="flex space-x-2">
              <button 
                (click)="goToPage((filter.pageNumber || 1) - 1)"
                [disabled]="(filter.pageNumber || 1) === 1"
                class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="px-3 py-1 text-sm">
                Page {{ filter.pageNumber || 1 }} of {{ totalPages }}
              </span>
              <button 
                (click)="goToPage((filter.pageNumber || 1) + 1)"
                [disabled]="(filter.pageNumber || 1) === totalPages"
                class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Modal -->
    <div *ngIf="showBulkActions" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Bulk Actions</h3>
        <p class="text-sm text-gray-600 mb-4">{{ selectedProducts.length }} products selected</p>
        
        <div class="space-y-4">
          <button 
            (click)="bulkUpdateStatus('active')"
            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark as Active
          </button>
          <button 
            (click)="bulkUpdateStatus('inactive')"
            class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Mark as Inactive
          </button>
          <button 
            (click)="bulkUpdateStatus('featured')"
            class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Mark as Featured
          </button>
          <button 
            (click)="showPriceAdjustment = true; showBulkActions = false"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adjust Prices
          </button>
          <button 
            (click)="showInventoryAdjustment = true; showBulkActions = false"
            class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Update Inventory
          </button>
          <button 
            (click)="bulkDelete()"
            class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Selected
          </button>
        </div>

        <button 
          (click)="showBulkActions = false"
          class="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Import Modal -->
    <div *ngIf="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Import Products from CSV</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
          <input 
            type="file"
            accept=".csv"
            (change)="onFileSelected($event)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <div class="text-sm text-gray-600 mb-4">
          <p>CSV should contain columns: SKU, Name, Description, Price, Stock, Category</p>
          <a href="#" class="text-blue-600 hover:underline">Download sample CSV</a>
        </div>

        <div class="flex space-x-3">
          <button 
            (click)="importProducts()"
            [disabled]="!selectedFile"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import
          </button>
          <button 
            (click)="showImportModal = false; selectedFile = null"
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
export class AdminProductsListComponent implements OnInit {
  products: Product[] = [];
  statistics: ProductStatistics = {} as ProductStatistics;
  filter: ProductFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDescending: false
  };
  totalCount = 0;
  totalPages = 0;
  loading = false;
  Math = Math;

  // Bulk operations
  bulkSelectMode = false;
  selectedProducts: string[] = [];
  showBulkActions = false;
  showPriceAdjustment = false;
  showInventoryAdjustment = false;

  // Import
  showImportModal = false;
  selectedFile: File | null = null;

  // Filter helpers
  statusFilter = '';
  stockFilter = '';

  constructor(
    private productService: AdminProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadStatistics();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts(this.filter).subscribe({
      next: (result) => {
        this.products = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  loadStatistics() {
    this.productService.getProductStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  applyFilters() {
    this.filter.pageNumber = 1;
    this.loadProducts();
  }

  applyStatusFilter() {
    switch (this.statusFilter) {
      case 'active':
        this.filter.isActive = true;
        this.filter.isFeatured = undefined;
        break;
      case 'inactive':
        this.filter.isActive = false;
        this.filter.isFeatured = undefined;
        break;
      case 'featured':
        this.filter.isFeatured = true;
        this.filter.isActive = undefined;
        break;
      default:
        this.filter.isActive = undefined;
        this.filter.isFeatured = undefined;
    }
    this.applyFilters();
  }

  applyStockFilter() {
    switch (this.stockFilter) {
      case 'instock':
        this.filter.minStock = 1;
        this.filter.maxStock = undefined;
        break;
      case 'lowstock':
        this.filter.minStock = 1;
        this.filter.maxStock = 10;
        break;
      case 'outofstock':
        this.filter.minStock = 0;
        this.filter.maxStock = 0;
        break;
      default:
        this.filter.minStock = undefined;
        this.filter.maxStock = undefined;
    }
    this.applyFilters();
  }

  resetFilters() {
    this.filter = {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDescending: false
    };
    this.statusFilter = '';
    this.stockFilter = '';
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.filter.pageNumber = page;
      this.loadProducts();
    }
  }

  toggleBulkSelect() {
    this.bulkSelectMode = !this.bulkSelectMode;
    if (!this.bulkSelectMode) {
      this.selectedProducts = [];
    }
  }

  toggleSelect(productId: string) {
    const index = this.selectedProducts.indexOf(productId);
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(productId);
    }
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedProducts = [];
    } else {
      this.selectedProducts = this.products.map(p => p.id);
    }
  }

  isSelected(productId: string): boolean {
    return this.selectedProducts.includes(productId);
  }

  isAllSelected(): boolean {
    return this.products.length > 0 && this.selectedProducts.length === this.products.length;
  }

  bulkUpdateStatus(status: string) {
    const dto: BulkUpdateDto = {
      productIds: this.selectedProducts
    };

    switch (status) {
      case 'active':
        dto.isActive = true;
        break;
      case 'inactive':
        dto.isActive = false;
        break;
      case 'featured':
        dto.isFeatured = true;
        break;
    }

    this.productService.bulkUpdateProducts(dto).subscribe({
      next: (result) => {
        this.showBulkActions = false;
        this.selectedProducts = [];
        this.bulkSelectMode = false;
        this.loadProducts();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Error updating products:', err);
      }
    });
  }

  bulkDelete() {
    if (!confirm(`Are you sure you want to delete ${this.selectedProducts.length} products?`)) {
      return;
    }

    this.productService.bulkDeleteProducts(this.selectedProducts).subscribe({
      next: (result) => {
        this.showBulkActions = false;
        this.selectedProducts = [];
        this.bulkSelectMode = false;
        this.loadProducts();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Error deleting products:', err);
      }
    });
  }

  duplicateProduct(product: Product) {
    // Navigate to create with product data
    this.router.navigate(['/admin/products/new'], { 
      queryParams: { duplicate: product.id } 
    });
  }

  deleteProduct(product: Product) {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  importProducts() {
    if (!this.selectedFile) return;

    this.productService.importProducts(this.selectedFile).subscribe({
      next: (result) => {
        alert(`Import complete: ${result.successCount} succeeded, ${result.failureCount} failed`);
        this.showImportModal = false;
        this.selectedFile = null;
        this.loadProducts();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Error importing products:', err);
      }
    });
  }

  exportProducts() {
    this.productService.exportProducts(this.filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting products:', err);
      }
    });
  }

  getProductImage(product: Product): string {
    const primaryImage = product.images?.find(i => i.isPrimary);
    return primaryImage?.url || 'assets/images/product-placeholder.png';
  }

  getStockClass(product: Product): string {
    if (product.quantityInStock === 0) {
      return 'bg-red-100 text-red-800';
    } else if (product.quantityInStock <= product.lowStockThreshold) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }
}