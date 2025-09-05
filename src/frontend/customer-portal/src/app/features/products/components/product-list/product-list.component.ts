import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductListItem, ProductFilters } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';

import * as ProductActions from '../../store/product.actions';
import * as CategoryActions from '../../store/category.actions';
import * as ProductSelectors from '../../store/product.selectors';
import * as CategorySelectors from '../../store/category.selectors';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  // View state
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  selectedCategory: number | null = null;
  sortBy = 'newest';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  constructor(private store: Store) {
    // Initialize observables
    this.products$ = this.store.select(ProductSelectors.selectProductItems);
    this.loading$ = this.store.select(ProductSelectors.selectProductsLoading);
    this.pageInfo$ = this.store.select(ProductSelectors.selectProductsPageInfo);
    this.filters$ = this.store.select(ProductSelectors.selectProductFilters);
    this.categories$ = this.store.select(CategorySelectors.selectRootCategories);
    this.selectedCategoryId$ = this.store.select(CategorySelectors.selectSelectedCategoryId);

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
    this.loadProducts();

    // Subscribe to filter changes to update local state
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.searchTerm = filters.searchTerm || '';
      this.selectedCategory = filters.categoryId || null;
      this.sortBy = filters.sortBy || 'newest';
      this.minPrice = filters.minPrice || null;
      this.maxPrice = filters.maxPrice || null;
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

  trackByProduct(index: number, product: ProductListItem): number {
    return product.id;
  }
}