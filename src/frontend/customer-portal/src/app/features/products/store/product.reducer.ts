import { createReducer, on } from '@ngrx/store';
import { ProductState, initialProductState } from './product.state';
import * as ProductActions from './product.actions';

export const productReducer = createReducer(
  initialProductState,

  // Load Products
  on(ProductActions.loadProducts, (state, { filters }) => ({
    ...state,
    loadingProducts: true,
    error: null,
    filters: { ...state.filters, ...filters }
  })),

  on(ProductActions.loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loadingProducts: false,
    error: null
  })),

  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loadingProducts: false,
    error
  })),

  // Load Product Details
  on(ProductActions.loadProduct, (state) => ({
    ...state,
    loadingSelectedProduct: true,
    error: null
  })),

  on(ProductActions.loadProductSuccess, (state, { product }) => ({
    ...state,
    selectedProduct: product,
    loadingSelectedProduct: false,
    error: null
  })),

  on(ProductActions.loadProductFailure, (state, { error }) => ({
    ...state,
    loadingSelectedProduct: false,
    error
  })),

  // Load Featured Products
  on(ProductActions.loadFeaturedProducts, (state) => ({
    ...state,
    loadingFeaturedProducts: true,
    error: null
  })),

  on(ProductActions.loadFeaturedProductsSuccess, (state, { products }) => ({
    ...state,
    featuredProducts: products,
    loadingFeaturedProducts: false,
    error: null
  })),

  on(ProductActions.loadFeaturedProductsFailure, (state, { error }) => ({
    ...state,
    loadingFeaturedProducts: false,
    error
  })),

  // Load Related Products
  on(ProductActions.loadRelatedProducts, (state) => ({
    ...state,
    loadingRelatedProducts: true,
    error: null
  })),

  on(ProductActions.loadRelatedProductsSuccess, (state, { products }) => ({
    ...state,
    relatedProducts: products,
    loadingRelatedProducts: false,
    error: null
  })),

  on(ProductActions.loadRelatedProductsFailure, (state, { error }) => ({
    ...state,
    loadingRelatedProducts: false,
    error
  })),

  // Update Filters
  on(ProductActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),

  on(ProductActions.resetFilters, (state) => ({
    ...state,
    filters: initialProductState.filters
  })),

  // Clear Actions
  on(ProductActions.clearSelectedProduct, (state) => ({
    ...state,
    selectedProduct: null
  })),

  on(ProductActions.clearProducts, (state) => ({
    ...state,
    products: null,
    selectedProduct: null,
    featuredProducts: [],
    relatedProducts: []
  }))
);