export enum OrderStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Refunded = 'Refunded'
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subTotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  trackingNumber?: string;
  carrier?: string;
  statusHistory?: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  notes?: string;
  changedBy?: string;
}

export interface OrderFilterRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: OrderStatus;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'total' | 'status' | 'number';
  sortDescending?: boolean;
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

export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  statusHistory: TrackingEvent[];
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface TrackingEvent {
  status: string;
  timestamp: string;
  description: string;
  notes?: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface UpdateOrderStatusRequest {
  newStatus: OrderStatus;
  notes?: string;
}

// Helper functions
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Pending:
      return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.Confirmed:
      return 'bg-blue-100 text-blue-800';
    case OrderStatus.Processing:
      return 'bg-indigo-100 text-indigo-800';
    case OrderStatus.Shipped:
      return 'bg-purple-100 text-purple-800';
    case OrderStatus.Delivered:
      return 'bg-green-100 text-green-800';
    case OrderStatus.Cancelled:
      return 'bg-red-100 text-red-800';
    case OrderStatus.Refunded:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Pending:
      return 'clock';
    case OrderStatus.Confirmed:
      return 'check-circle';
    case OrderStatus.Processing:
      return 'cog';
    case OrderStatus.Shipped:
      return 'truck';
    case OrderStatus.Delivered:
      return 'check-double';
    case OrderStatus.Cancelled:
      return 'x-circle';
    case OrderStatus.Refunded:
      return 'refresh';
    default:
      return 'question-circle';
  }
}

export function canCancelOrder(order: Order): boolean {
  return [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing]
    .includes(order.status);
}

export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}