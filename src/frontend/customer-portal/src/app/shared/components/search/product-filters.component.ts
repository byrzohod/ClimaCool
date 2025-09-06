import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductFilters } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.component.html'
})
export class ProductFiltersComponent implements OnInit {
  @Input() filters: ProductFilters = {};
  @Output() filtersChanged = new EventEmitter<ProductFilters>();

  categories: Category[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onFiltersChange() {
    // Clean up undefined values
    const cleanFilters: ProductFilters = {};
    
    if (this.filters.searchTerm) {
      cleanFilters.searchTerm = this.filters.searchTerm;
    }
    if (this.filters.categoryId) {
      cleanFilters.categoryId = this.filters.categoryId;
    }
    if (this.filters.minPrice !== undefined && this.filters.minPrice !== null) {
      cleanFilters.minPrice = this.filters.minPrice;
    }
    if (this.filters.maxPrice !== undefined && this.filters.maxPrice !== null) {
      cleanFilters.maxPrice = this.filters.maxPrice;
    }
    if (this.filters.sortBy) {
      cleanFilters.sortBy = this.filters.sortBy;
    }
    if (this.filters.inStockOnly) {
      cleanFilters.inStockOnly = this.filters.inStockOnly;
    }
    if (this.filters.featuredOnly) {
      cleanFilters.featuredOnly = this.filters.featuredOnly;
    }
    if (this.filters.pageIndex) {
      cleanFilters.pageIndex = this.filters.pageIndex;
    }
    if (this.filters.pageSize) {
      cleanFilters.pageSize = this.filters.pageSize;
    }

    this.filtersChanged.emit(cleanFilters);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.categoryId ||
      this.filters.minPrice !== undefined ||
      this.filters.maxPrice !== undefined ||
      this.filters.inStockOnly ||
      this.filters.featuredOnly
    );
  }

  clearAllFilters() {
    this.filters = {
      searchTerm: this.filters.searchTerm, // Keep search term
      pageIndex: 1,
      pageSize: this.filters.pageSize
    };
    this.onFiltersChange();
  }

  clearCategoryFilter() {
    this.filters.categoryId = undefined;
    this.onFiltersChange();
  }

  clearPriceFilter() {
    this.filters.minPrice = undefined;
    this.filters.maxPrice = undefined;
    this.onFiltersChange();
  }

  clearInStockFilter() {
    this.filters.inStockOnly = undefined;
    this.onFiltersChange();
  }

  clearFeaturedFilter() {
    this.filters.featuredOnly = undefined;
    this.onFiltersChange();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }
}