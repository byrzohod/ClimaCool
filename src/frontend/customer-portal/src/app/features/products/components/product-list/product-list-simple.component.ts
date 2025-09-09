import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list-simple',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Products</h1>
        <div class="mt-4">
          <input 
            type="text" 
            placeholder="Search products, brands, categories..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md"
            [(ngModel)]="searchTerm"
          />
        </div>
        <div class="mt-4 flex space-x-2">
          <button 
            (click)="viewMode = 'grid'"
            [class.bg-blue-600]="viewMode === 'grid'"
            [class.text-white]="viewMode === 'grid'"
            [class.bg-white]="viewMode !== 'grid'"
            class="px-4 py-2 border border-gray-300 rounded-md">
            Grid
          </button>
          <button 
            (click)="viewMode = 'list'"
            [class.bg-blue-600]="viewMode === 'list'"
            [class.text-white]="viewMode === 'list'"
            [class.bg-white]="viewMode !== 'list'"
            class="px-4 py-2 border border-gray-300 rounded-md">
            List
          </button>
        </div>
      </div>
      
      <div class="text-center py-8 text-gray-500">
        <p>No products available</p>
      </div>
    </div>
  `
})
export class ProductListSimpleComponent {
  searchTerm = '';
  viewMode: 'grid' | 'list' = 'grid';
}