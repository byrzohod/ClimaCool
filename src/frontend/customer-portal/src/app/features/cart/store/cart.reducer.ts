import { createReducer, on } from '@ngrx/store';
import { CartState } from './cart.state';
import * as CartActions from './cart.actions';

export const initialState: CartState = {
  cart: null,
  summary: null,
  loading: false,
  error: null,
  cartOpen: false
};

export const cartReducer = createReducer(
  initialState,

  // Load Cart
  on(CartActions.loadCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.loadCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    loading: false,
    error: null
  })),
  on(CartActions.loadCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Cart Summary
  on(CartActions.loadCartSummary, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.loadCartSummarySuccess, (state, { summary }) => ({
    ...state,
    summary,
    loading: false,
    error: null
  })),
  on(CartActions.loadCartSummaryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add to Cart
  on(CartActions.addToCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.addToCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    summary: {
      itemCount: cart.itemCount,
      subTotal: cart.subTotal
    },
    loading: false,
    error: null,
    cartOpen: true // Open cart after adding item
  })),
  on(CartActions.addToCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Cart Item
  on(CartActions.updateCartItem, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.updateCartItemSuccess, (state, { cart }) => ({
    ...state,
    cart,
    summary: {
      itemCount: cart.itemCount,
      subTotal: cart.subTotal
    },
    loading: false,
    error: null
  })),
  on(CartActions.updateCartItemFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Remove from Cart
  on(CartActions.removeFromCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.removeFromCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    summary: {
      itemCount: cart.itemCount,
      subTotal: cart.subTotal
    },
    loading: false,
    error: null
  })),
  on(CartActions.removeFromCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Cart
  on(CartActions.clearCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.clearCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    summary: {
      itemCount: cart.itemCount,
      subTotal: cart.subTotal
    },
    loading: false,
    error: null
  })),
  on(CartActions.clearCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Merge Carts
  on(CartActions.mergeCarts, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(CartActions.mergeCartsSuccess, (state, { merged }) => ({
    ...state,
    loading: false,
    error: null
  })),
  on(CartActions.mergeCartsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // UI Actions
  on(CartActions.toggleCart, (state) => ({
    ...state,
    cartOpen: !state.cartOpen
  })),
  on(CartActions.openCart, (state) => ({
    ...state,
    cartOpen: true
  })),
  on(CartActions.closeCart, (state) => ({
    ...state,
    cartOpen: false
  }))
);