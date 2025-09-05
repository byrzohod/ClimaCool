import { createAction, props } from '@ngrx/store';
import { Cart, AddToCart, UpdateCartItem, CartSummary } from '../models/cart.model';

// Load Cart
export const loadCart = createAction('[Cart] Load Cart');
export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ cart: Cart }>()
);
export const loadCartFailure = createAction(
  '[Cart] Load Cart Failure',
  props<{ error: string }>()
);

// Load Cart Summary
export const loadCartSummary = createAction('[Cart] Load Cart Summary');
export const loadCartSummarySuccess = createAction(
  '[Cart] Load Cart Summary Success',
  props<{ summary: CartSummary }>()
);
export const loadCartSummaryFailure = createAction(
  '[Cart] Load Cart Summary Failure',
  props<{ error: string }>()
);

// Add to Cart
export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ item: AddToCart }>()
);
export const addToCartSuccess = createAction(
  '[Cart] Add To Cart Success',
  props<{ cart: Cart }>()
);
export const addToCartFailure = createAction(
  '[Cart] Add To Cart Failure',
  props<{ error: string }>()
);

// Update Cart Item
export const updateCartItem = createAction(
  '[Cart] Update Cart Item',
  props<{ productId: number; update: UpdateCartItem }>()
);
export const updateCartItemSuccess = createAction(
  '[Cart] Update Cart Item Success',
  props<{ cart: Cart }>()
);
export const updateCartItemFailure = createAction(
  '[Cart] Update Cart Item Failure',
  props<{ error: string }>()
);

// Remove from Cart
export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: number }>()
);
export const removeFromCartSuccess = createAction(
  '[Cart] Remove From Cart Success',
  props<{ cart: Cart }>()
);
export const removeFromCartFailure = createAction(
  '[Cart] Remove From Cart Failure',
  props<{ error: string }>()
);

// Clear Cart
export const clearCart = createAction('[Cart] Clear Cart');
export const clearCartSuccess = createAction(
  '[Cart] Clear Cart Success',
  props<{ cart: Cart }>()
);
export const clearCartFailure = createAction(
  '[Cart] Clear Cart Failure',
  props<{ error: string }>()
);

// Merge Carts
export const mergeCarts = createAction('[Cart] Merge Carts');
export const mergeCartsSuccess = createAction(
  '[Cart] Merge Carts Success',
  props<{ merged: boolean }>()
);
export const mergeCartsFailure = createAction(
  '[Cart] Merge Carts Failure',
  props<{ error: string }>()
);

// UI Actions
export const toggleCart = createAction('[Cart] Toggle Cart');
export const openCart = createAction('[Cart] Open Cart');
export const closeCart = createAction('[Cart] Close Cart');