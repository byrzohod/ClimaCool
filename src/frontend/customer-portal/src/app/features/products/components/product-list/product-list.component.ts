import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductListItem, ProductFilters, Product, PagedResult } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { AddToCartComponent } from '../../../cart/components/add-to-cart/add-to-cart.component';
import { SearchInputComponent } from '../../../../shared/components/search/search-input.component';
import { ProductFiltersComponent } from '../../../../shared/components/search/product-filters.component';
import { SearchResultsHeaderComponent } from '../../../../shared/components/search/search-results-header.component';

import * as ProductActions from '../../store/product.actions';
import * as CategoryActions from '../../store/category.actions';
import * as ProductSelectors from '../../store/product.selectors';
import * as CategorySelectors from '../../store/category.selectors';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    AddToCartComponent,
    SearchInputComponent,
    ProductFiltersComponent,
    SearchResultsHeaderComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;

  // Observable data
  products$: Observable<ProductListItem[]>;
  loading$: Observable<boolean>;
  pageInfo$: Observable<any>;
  filters$: Observable<ProductFilters>;
  categories$: Observable<Category[]>;
  selectedCategoryId$: Observable<number | null>;
  
  // New properties for enhanced search
  currentFilters: ProductFilters = {};
  pagedResult$: Observable<PagedResult<ProductListItem> | null>;

  // View state
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  selectedCategory: number | null = null;
  sortBy = 'newest';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  constructor(
    private store: Store,
    private route: ActivatedRoute
  ) {
    // Initialize observables
    this.products$ = this.store.select(ProductSelectors.selectProductItems);
    this.loading$ = this.store.select(ProductSelectors.selectProductsLoading);
    this.pageInfo$ = this.store.select(ProductSelectors.selectProductsPageInfo);
    this.filters$ = this.store.select(ProductSelectors.selectProductFilters);
    this.categories$ = this.store.select(CategorySelectors.selectRootCategories);
    this.selectedCategoryId$ = this.store.select(CategorySelectors.selectSelectedCategoryId);
    
    // Initialize pagedResult$ - we'll use this for the new search components
    this.pagedResult$ = this.store.select(ProductSelectors.selectProductsPagedResult);

    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.updateFilters({ searchTerm, pageIndex: 1 });
    });
  }

  ngOnInit() {
    // Load initial data
    this.store.dispatch(CategoryActions.loadCategories());
    
    // Handle query parameters from navigation (e.g., from header search)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) {
        this.currentFilters = { 
          ...this.currentFilters, 
          searchTerm: params['search'],
          pageIndex: 1 
        };
        this.updateFilters(this.currentFilters);
      } else {
        this.loadProducts();
      }
    });

    // Subscribe to filter changes to update local state
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.searchTerm = filters.searchTerm || '';
      this.selectedCategory = filters.categoryId || null;
      this.sortBy = filters.sortBy || 'newest';
      this.minPrice = filters.minPrice || null;
      this.maxPrice = filters.maxPrice || null;
      this.currentFilters = filters;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts() {
    this.store.dispatch(ProductActions.loadProducts({ filters: {} }));
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  onCategoryChange() {
    this.store.dispatch(CategoryActions.setSelectedCategory({ 
      categoryId: this.selectedCategory || undefined 
    }));
    this.updateFilters({ 
      categoryId: this.selectedCategory || undefined, 
      pageIndex: 1 
    });
  }

  onSortChange() {
    this.updateFilters({ sortBy: this.sortBy, pageIndex: 1 });
  }

  onPriceFilterChange() {
    this.updateFilters({ 
      minPrice: this.minPrice || undefined, 
      maxPrice: this.maxPrice || undefined, 
      pageIndex: 1 
    });
  }

  onPageChange(pageIndex: number) {
    this.updateFilters({ pageIndex });
  }

  onViewModeChange(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'newest';
    this.store.dispatch(ProductActions.resetFilters());
    this.store.dispatch(CategoryActions.clearSelectedCategory());
    this.loadProducts();
  }

  private updateFilters(filters: Partial<ProductFilters>) {
    this.store.dispatch(ProductActions.updateFilters({ filters }));
    this.store.dispatch(ProductActions.loadProducts({ 
      filters: { ...filters } 
    }));
  }

  // New methods for enhanced search functionality
  onSearchChanged(searchTerm: string) {
    this.currentFilters = { ...this.currentFilters, searchTerm, pageIndex: 1 };
    this.updateFilters(this.currentFilters);
  }

  onFiltersChanged(filters: ProductFilters) {
    this.currentFilters = { ...filters, pageIndex: 1 };
    this.updateFilters(this.currentFilters);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.currentFilters.categoryId) count++;
    if (this.currentFilters.minPrice !== undefined || this.currentFilters.maxPrice !== undefined) count++;
    if (this.currentFilters.inStockOnly) count++;
    if (this.currentFilters.featuredOnly) count++;
    return count;
  }

  trackByProduct(index: number, product: ProductListItem): number {
    return product.id;
  }

  convertToProduct(listItem: ProductListItem): Product {
    return {
      id: listItem.id,
      name: listItem.name,
      slug: listItem.slug,
      shortDescription: listItem.shortDescription,
      price: listItem.price,
      compareAtPrice: listItem.compareAtPrice,
      brand: listItem.brand,
      primaryImageUrl: listItem.primaryImageUrl,
      inStock: listItem.inStock,
      isFeatured: listItem.isFeatured,
      averageRating: listItem.averageRating,
      reviewCount: listItem.reviewCount,
      stockQuantity: listItem.inStock ? 10 : 0, // Estimate stock for cart component
      // Required fields for Product interface (using defaults)
      sku: '',
      categoryId: 0,
      categoryName: '',
      productType: 0 as any,
      isActive: true,
      images: [],
      variants: [],
      attributes: [],
      createdAt: ''
    };
  }
}