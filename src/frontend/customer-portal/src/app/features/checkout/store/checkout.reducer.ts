import { createReducer, on } from '@ngrx/store';
import { CheckoutActions } from './checkout.actions';
import { CheckoutState, initialCheckoutState } from './checkout.state';
import { AddressType } from '../models/checkout.models';

export const checkoutReducer = createReducer(
  initialCheckoutState,

  // Order actions
  on(CheckoutActions.createOrder, (state) => ({
    ...state,
    creatingOrder: true,
    error: null
  })),

  on(CheckoutActions.createOrderSuccess, (state, { order }) => ({
    ...state,
    currentOrder: order,
    creatingOrder: false,
    currentStep: 3,
    error: null
  })),

  on(CheckoutActions.createOrderFailure, (state, { error }) => ({
    ...state,
    creatingOrder: false,
    error
  })),

  on(CheckoutActions.loadOrder, (state) => ({
    ...state,
    loadingOrder: true,
    orderError: null
  })),

  on(CheckoutActions.loadOrderSuccess, (state, { order }) => ({
    ...state,
    currentOrder: order,
    loadingOrder: false,
    orderError: null
  })),

  on(CheckoutActions.loadOrderFailure, (state, { error }) => ({
    ...state,
    loadingOrder: false,
    orderError: error
  })),

  on(CheckoutActions.loadOrders, (state) => ({
    ...state,
    loadingOrders: true,
    orderError: null
  })),

  on(CheckoutActions.loadOrdersSuccess, (state, { orders }) => ({
    ...state,
    orders,
    loadingOrders: false,
    orderError: null
  })),

  on(CheckoutActions.loadOrdersFailure, (state, { error }) => ({
    ...state,
    loadingOrders: false,
    orderError: error
  })),

  // Address actions
  on(CheckoutActions.setShippingAddress, (state, { address }) => ({
    ...state,
    shippingAddress: address,
    // If same as shipping is enabled, also update billing address
    billingAddress: state.sameAsShipping 
      ? { ...address, type: AddressType.Billing }
      : state.billingAddress
  })),

  on(CheckoutActions.setBillingAddress, (state, { address }) => ({
    ...state,
    billingAddress: address
  })),

  on(CheckoutActions.setSameAsShipping, (state, { sameAsShipping }) => ({
    ...state,
    sameAsShipping,
    // If enabling same as shipping, copy shipping address to billing
    billingAddress: sameAsShipping && state.shippingAddress
      ? { ...state.shippingAddress, type: AddressType.Billing }
      : state.billingAddress
  })),

  on(CheckoutActions.setOrderNotes, (state, { notes }) => ({
    ...state,
    notes
  })),

  // Checkout flow actions
  on(CheckoutActions.setCurrentStep, (state, { step }) => ({
    ...state,
    currentStep: step
  })),

  on(CheckoutActions.nextStep, (state) => ({
    ...state,
    currentStep: Math.min(state.currentStep + 1, state.steps.length)
  })),

  on(CheckoutActions.previousStep, (state) => ({
    ...state,
    currentStep: Math.max(state.currentStep - 1, 1)
  })),

  on(CheckoutActions.resetCheckout, () => ({
    ...initialCheckoutState
  })),

  // Validation actions
  on(CheckoutActions.setShippingValid, (state, { valid }) => ({
    ...state,
    shippingValid: valid
  })),

  on(CheckoutActions.setBillingValid, (state, { valid }) => ({
    ...state,
    billingValid: valid
  })),

  // Clear actions
  on(CheckoutActions.clearError, (state) => ({
    ...state,
    error: null,
    orderError: null
  })),

  on(CheckoutActions.clearCurrentOrder, (state) => ({
    ...state,
    currentOrder: null,
    currentStep: 1
  }))
);