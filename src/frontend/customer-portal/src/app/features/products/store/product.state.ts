import { Product, ProductListItem, ProductFilters, PagedResult } from '../../../core/models/product.model';

export interface ProductState {
  products: PagedResult<ProductListItem> | null;
  selectedProduct: Product | null;
  featuredProducts: ProductListItem[];
  relatedProducts: ProductListItem[];
  filters: ProductFilters;
  loading: boolean;
  error: string | null;
  
  // Loading states for specific operations
  loadingProducts: boolean;
  loadingSelectedProduct: boolean;
  loadingFeaturedProducts: boolean;
  loadingRelatedProducts: boolean;
}

export const initialProductState: ProductState = {
  products: null,
  selectedProduct: null,
  featuredProducts: [],
  relatedProducts: [],
  filters: {
    pageIndex: 1,
    pageSize: 20,
    sortBy: 'newest'
  },
  loading: false,
  error: null,
  loadingProducts: false,
  loadingSelectedProduct: false,
  loadingFeaturedProducts: false,
  loadingRelatedProducts: false
};