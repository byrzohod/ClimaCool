import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagedResult, ProductListItem } from '../../../core/models/product.model';

@Component({
  selector: 'app-search-results-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            <ng-container *ngIf="searchTerm; else defaultTitle">
              Search Results for "{{ searchTerm }}"
            </ng-container>
            <ng-template #defaultTitle>
              All Products
            </ng-template>
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            <ng-container *ngIf="results; else loadingResults">
              {{ getResultsText() }}
            </ng-container>
            <ng-template #loadingResults>
              Loading...
            </ng-template>
          </p>
        </div>
        
        <!-- Results info -->
        <div *ngIf="results && results.totalCount > 0" class="text-sm text-gray-500">
          Showing {{ getStartItem() }}-{{ getEndItem() }} of {{ results.totalCount }} results
        </div>
      </div>
      
      <!-- Active search info -->
      <div *ngIf="hasActiveFilters()" class="mt-3 flex flex-wrap gap-2">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {{ getActiveFiltersCount() }} filter(s) applied
        </span>
        <button
          (click)="onClearFilters()"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Clear all filters
          <svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class SearchResultsHeaderComponent {
  @Input() searchTerm?: string;
  @Input() results?: PagedResult<ProductListItem>;
  @Input() isLoading = false;
  @Input() activeFiltersCount = 0;

  getResultsText(): string {
    if (!this.results) return '';
    
    const { totalCount } = this.results;
    
    if (totalCount === 0) {
      return this.searchTerm ? 'No products found' : 'No products available';
    }
    
    if (totalCount === 1) {
      return '1 product found';
    }
    
    return `${totalCount.toLocaleString()} products found`;
  }

  getStartItem(): number {
    if (!this.results || this.results.totalCount === 0) return 0;
    return (this.results.pageIndex - 1) * this.results.pageSize + 1;
  }

  getEndItem(): number {
    if (!this.results || this.results.totalCount === 0) return 0;
    const calculated = this.results.pageIndex * this.results.pageSize;
    return Math.min(calculated, this.results.totalCount);
  }

  hasActiveFilters(): boolean {
    return this.activeFiltersCount > 0;
  }

  getActiveFiltersCount(): number {
    return this.activeFiltersCount;
  }

  onClearFilters() {
    // This would typically emit an event to parent component
    // For now, we'll just show a placeholder behavior
    console.log('Clear filters requested');
  }
}