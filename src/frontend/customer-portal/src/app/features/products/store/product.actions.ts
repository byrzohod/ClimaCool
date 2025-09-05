import { createAction, props } from '@ngrx/store';
import { Product, ProductListItem, ProductFilters, PagedResult } from '../../../core/models/product.model';

// Load Products Actions
export const loadProducts = createAction(
  '[Product] Load Products',
  props<{ filters: ProductFilters }>()
);

export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: PagedResult<ProductListItem> }>()
);

export const loadProductsFailure = createAction(
  '[Product] Load Products Failure',
  props<{ error: string }>()
);

// Load Product Details Actions
export const loadProduct = createAction(
  '[Product] Load Product',
  props<{ id?: number; slug?: string }>()
);

export const loadProductSuccess = createAction(
  '[Product] Load Product Success',
  props<{ product: Product }>()
);

export const loadProductFailure = createAction(
  '[Product] Load Product Failure',
  props<{ error: string }>()
);

// Load Featured Products Actions
export const loadFeaturedProducts = createAction(
  '[Product] Load Featured Products',
  props<{ count?: number }>()
);

export const loadFeaturedProductsSuccess = createAction(
  '[Product] Load Featured Products Success',
  props<{ products: ProductListItem[] }>()
);

export const loadFeaturedProductsFailure = createAction(
  '[Product] Load Featured Products Failure',
  props<{ error: string }>()
);

// Load Related Products Actions
export const loadRelatedProducts = createAction(
  '[Product] Load Related Products',
  props<{ productId: number; count?: number }>()
);

export const loadRelatedProductsSuccess = createAction(
  '[Product] Load Related Products Success',
  props<{ products: ProductListItem[] }>()
);

export const loadRelatedProductsFailure = createAction(
  '[Product] Load Related Products Failure',
  props<{ error: string }>()
);

// Update Filters Actions
export const updateFilters = createAction(
  '[Product] Update Filters',
  props<{ filters: Partial<ProductFilters> }>()
);

export const resetFilters = createAction('[Product] Reset Filters');

// Clear Actions
export const clearSelectedProduct = createAction('[Product] Clear Selected Product');

export const clearProducts = createAction('[Product] Clear Products');