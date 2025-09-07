export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Processing = 3,
  Shipped = 4,
  Delivered = 5,
  Cancelled = 6,
  Refunded = 7
}

export enum AddressType {
  Billing = 1,
  Shipping = 2,
  Both = 3
}

export interface Address {
  id?: string;
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
  isDefault: boolean;
  type: AddressType;
}

export interface OrderItem {
  id: number;
  productId: number;
  productVariantId?: number;
  productName: string;
  productSku?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  total: number;
  productDescription?: string;
  productImageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subTotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
}

export interface CheckoutState {
  currentStep: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  sameAsShipping: boolean;
  notes?: string;
  order?: Order;
  loading: boolean;
  error?: string;
}