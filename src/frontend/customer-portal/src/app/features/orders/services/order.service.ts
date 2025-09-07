import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Order,
  OrderFilterRequest,
  PagedResult,
  OrderStatistics,
  TrackingInfo,
  OrderStatusHistory,
  CancelOrderRequest,
  UpdateOrderStatusRequest,
  OrderStatus
} from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/ordermanagement`;

  constructor(private http: HttpClient) {}

  // Customer endpoints
  getMyOrders(filter?: OrderFilterRequest): Observable<PagedResult<Order>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
      if (filter.status) params = params.set('status', filter.status);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending !== undefined) {
        params = params.set('sortDescending', filter.sortDescending.toString());
      }
    }

    return this.http.get<PagedResult<Order>>(`${this.apiUrl}/my-orders`, { params });
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  getTrackingInfo(orderId: string): Observable<TrackingInfo> {
    return this.http.get<TrackingInfo>(`${this.apiUrl}/${orderId}/tracking`);
  }

  getOrderHistory(orderId: string): Observable<OrderStatusHistory[]> {
    return this.http.get<OrderStatusHistory[]>(`${this.apiUrl}/${orderId}/history`);
  }

  cancelOrder(orderId: string, reason: string): Observable<Order> {
    const request: CancelOrderRequest = { reason };
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/cancel`, request);
  }

  canCancelOrder(orderId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${orderId}/can-cancel`);
  }

  reorder(orderId: string): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(`${this.apiUrl}/${orderId}/reorder`, {});
  }

  getStatistics(): Observable<OrderStatistics> {
    return this.http.get<OrderStatistics>(`${this.apiUrl}/statistics`);
  }

  // Admin endpoints
  getAllOrders(filter?: OrderFilterRequest): Observable<PagedResult<Order>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
      if (filter.status) params = params.set('status', filter.status);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending !== undefined) {
        params = params.set('sortDescending', filter.sortDescending.toString());
      }
    }

    return this.http.get<PagedResult<Order>>(`${this.apiUrl}/admin/all`, { params });
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Observable<Order> {
    const request: UpdateOrderStatusRequest = { newStatus, notes };
    return this.http.put<Order>(`${this.apiUrl}/admin/${orderId}/status`, request);
  }

  getOverallStatistics(): Observable<OrderStatistics> {
    return this.http.get<OrderStatistics>(`${this.apiUrl}/admin/statistics`);
  }
}