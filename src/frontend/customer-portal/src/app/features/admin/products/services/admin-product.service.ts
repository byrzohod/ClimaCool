import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  quantityInStock: number;
  lowStockThreshold: number;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  images?: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  displayOrder?: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  shortDescription: string;
  slug?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  quantityInStock: number;
  lowStockThreshold?: number;
  categoryId: string;
  brand?: string;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  images?: ProductImage[];
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  shortDescription?: string;
  slug?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  cost?: number;
  quantityInStock?: number;
  lowStockThreshold?: number;
  categoryId?: string;
  brand?: string;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  images?: ProductImage[];
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface BulkUpdateDto {
  productIds: string[];
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  priceAdjustment?: number;
  priceAdjustmentType?: 'percentage' | 'fixed';
  stockAdjustment?: number;
  tags?: string[];
}

export interface InventoryUpdateDto {
  productId: string;
  quantity: number;
  adjustmentType: 'set' | 'add' | 'subtract';
  reason?: string;
}

export interface BulkOperationResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

export interface ImportResult extends BulkOperationResult {
  totalRows: number;
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  featuredProducts: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
  averagePrice: number;
  categoriesInUse: number;
}

export interface ProductFilterRequest {
  searchTerm?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  brand?: string;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private readonly apiUrl = `${environment.apiUrl}/admin/products`;

  constructor(private http: HttpClient) {}

  getProducts(filter?: ProductFilterRequest): Observable<PagedResult<Product>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
      if (filter.minPrice !== undefined) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice !== undefined) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.minStock !== undefined) params = params.set('minStock', filter.minStock.toString());
      if (filter.maxStock !== undefined) params = params.set('maxStock', filter.maxStock.toString());
      if (filter.brand) params = params.set('brand', filter.brand);
      if (filter.tags?.length) params = params.set('tags', filter.tags.join(','));
      if (filter.isActive !== undefined) params = params.set('isActive', filter.isActive.toString());
      if (filter.isFeatured !== undefined) params = params.set('isFeatured', filter.isFeatured.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending.toString());
      if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<PagedResult<Product>>(this.apiUrl, { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: UpdateProductDto): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkUpdateProducts(dto: BulkUpdateDto): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/bulk-update`, dto);
  }

  bulkDeleteProducts(productIds: string[]): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/bulk-delete`, productIds);
  }

  uploadProductImage(productId: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string }>(`${this.apiUrl}/${productId}/images`, formData);
  }

  deleteProductImage(productId: string, imageUrl: string): Observable<void> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.http.delete<void>(`${this.apiUrl}/${productId}/images`, { params });
  }

  importProducts(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ImportResult>(`${this.apiUrl}/import`, formData);
  }

  exportProducts(filter?: ProductFilterRequest): Observable<Blob> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
      if (filter.isActive !== undefined) params = params.set('isActive', filter.isActive.toString());
      if (filter.isFeatured !== undefined) params = params.set('isFeatured', filter.isFeatured.toString());
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  updateInventory(updates: InventoryUpdateDto[]): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/inventory/update`, updates);
  }

  getLowStockProducts(threshold: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/low-stock`, { params });
  }

  getProductStatistics(): Observable<ProductStatistics> {
    return this.http.get<ProductStatistics>(`${this.apiUrl}/statistics`);
  }
}