import { Address, Order } from '../models/checkout.models';

export interface CheckoutState {
  // Current checkout data
  shippingAddress: Address | null;
  billingAddress: Address | null;
  sameAsShipping: boolean;
  notes: string;

  // Checkout flow
  currentStep: number;
  steps: string[];

  // Validation
  shippingValid: boolean;
  billingValid: boolean;

  // Orders
  currentOrder: Order | null;
  orders: Order[];

  // Loading states
  loading: boolean;
  creatingOrder: boolean;
  loadingOrder: boolean;
  loadingOrders: boolean;

  // Error handling
  error: string | null;
  orderError: string | null;
}

export const initialCheckoutState: CheckoutState = {
  // Current checkout data
  shippingAddress: null,
  billingAddress: null,
  sameAsShipping: true,
  notes: '',

  // Checkout flow
  currentStep: 1,
  steps: ['Shipping', 'Review', 'Confirmation'],

  // Validation
  shippingValid: false,
  billingValid: false,

  // Orders
  currentOrder: null,
  orders: [],

  // Loading states
  loading: false,
  creatingOrder: false,
  loadingOrder: false,
  loadingOrders: false,

  // Error handling
  error: null,
  orderError: null
};