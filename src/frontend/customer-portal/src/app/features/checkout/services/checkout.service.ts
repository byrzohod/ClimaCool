import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order, Address } from '../models/checkout.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly apiUrl = `${environment.apiUrl}/checkout`;
  private readonly addressUrl = `${environment.apiUrl}/address`;

  constructor(private http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/create-order`, request);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

  getUserOrders(page: number = 1, pageSize: number = 10): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders?page=${page}&pageSize=${pageSize}`);
  }

  cancelOrder(orderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/orders/${orderId}/cancel`, {});
  }

  // Address management
  getUserAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.addressUrl);
  }

  getAddress(addressId: string): Observable<Address> {
    return this.http.get<Address>(`${this.addressUrl}/${addressId}`);
  }

  createAddress(address: Address): Observable<Address> {
    return this.http.post<Address>(this.addressUrl, address);
  }

  updateAddress(addressId: string, address: Address): Observable<Address> {
    return this.http.put<Address>(`${this.addressUrl}/${addressId}`, address);
  }

  deleteAddress(addressId: string): Observable<void> {
    return this.http.delete<void>(`${this.addressUrl}/${addressId}`);
  }

  setDefaultAddress(addressId: string): Observable<void> {
    return this.http.post<void>(`${this.addressUrl}/${addressId}/set-default`, {});
  }
}