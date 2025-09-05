import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './product.state';

export const selectProductState = createFeatureSelector<ProductState>('products');

// Product List Selectors
export const selectProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.products
);

export const selectProductItems = createSelector(
  selectProducts,
  (products) => products?.items || []
);

export const selectProductsLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loadingProducts
);

export const selectProductsTotalCount = createSelector(
  selectProducts,
  (products) => products?.totalCount || 0
);

export const selectProductsPageInfo = createSelector(
  selectProducts,
  (products) => ({
    pageIndex: products?.pageIndex || 1,
    pageSize: products?.pageSize || 20,
    totalCount: products?.totalCount || 0,
    totalPages: products ? Math.ceil(products.totalCount / products.pageSize) : 0,
    hasNextPage: products ? products.pageIndex < Math.ceil(products.totalCount / products.pageSize) : false,
    hasPreviousPage: products ? products.pageIndex > 1 : false
  })
);

// Selected Product Selectors
export const selectSelectedProduct = createSelector(
  selectProductState,
  (state: ProductState) => state.selectedProduct
);

export const selectSelectedProductLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loadingSelectedProduct
);

// Featured Products Selectors
export const selectFeaturedProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.featuredProducts
);

export const selectFeaturedProductsLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loadingFeaturedProducts
);

// Related Products Selectors
export const selectRelatedProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.relatedProducts
);

export const selectRelatedProductsLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loadingRelatedProducts
);

// Filters Selectors
export const selectProductFilters = createSelector(
  selectProductState,
  (state: ProductState) => state.filters
);

export const selectCurrentSearchTerm = createSelector(
  selectProductFilters,
  (filters) => filters.searchTerm || ''
);

export const selectCurrentCategoryFilter = createSelector(
  selectProductFilters,
  (filters) => filters.categoryId
);

export const selectCurrentSortBy = createSelector(
  selectProductFilters,
  (filters) => filters.sortBy || 'newest'
);

// Error and Loading Selectors
export const selectProductError = createSelector(
  selectProductState,
  (state: ProductState) => state.error
);

export const selectAnyProductLoading = createSelector(
  selectProductState,
  (state: ProductState) => 
    state.loadingProducts || 
    state.loadingSelectedProduct || 
    state.loadingFeaturedProducts || 
    state.loadingRelatedProducts
);