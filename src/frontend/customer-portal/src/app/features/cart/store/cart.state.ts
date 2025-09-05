import { Cart, CartSummary } from '../models/cart.model';

export interface CartState {
  cart: Cart | null;
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  cartOpen: boolean;
}