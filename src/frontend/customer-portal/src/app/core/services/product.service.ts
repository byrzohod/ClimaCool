import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductListItem, ProductFilters, PagedResult } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/api/product`;

  constructor(private http: HttpClient) {}

  getProducts(filters: ProductFilters = {}): Observable<PagedResult<ProductListItem>> {
    let params = new HttpParams();
    
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.minPrice) {
      params = params.set('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params = params.set('maxPrice', filters.maxPrice.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.pageIndex) {
      params = params.set('pageIndex', filters.pageIndex.toString());
    }
    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http.get<PagedResult<ProductListItem>>(this.apiUrl, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/slug/${slug}`);
  }

  getFeaturedProducts(count: number = 10): Observable<ProductListItem[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/featured`, { params });
  }

  getProductsByCategory(categoryId: number): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  getRelatedProducts(productId: number, count: number = 6): Observable<ProductListItem[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<ProductListItem[]>(`${this.apiUrl}/${productId}/related`, { params });
  }
}