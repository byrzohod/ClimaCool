import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cart, AddToCart, UpdateCartItem, CartSummary } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl, { withCredentials: true });
  }

  getCartSummary(): Observable<CartSummary> {
    return this.http.get<CartSummary>(`${this.apiUrl}/summary`, { withCredentials: true });
  }

  addToCart(item: AddToCart): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/items`, item, { withCredentials: true });
  }

  updateCartItem(productId: number, update: UpdateCartItem): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/items/${productId}`, update, { withCredentials: true });
  }

  removeFromCart(productId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/items/${productId}`, { withCredentials: true });
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>(this.apiUrl, { withCredentials: true });
  }

  mergeCarts(): Observable<{ merged: boolean }> {
    return this.http.post<{ merged: boolean }>(`${this.apiUrl}/merge`, null, { withCredentials: true });
  }
}