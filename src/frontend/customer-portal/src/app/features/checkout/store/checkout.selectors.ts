import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CheckoutState } from './checkout.state';

export const selectCheckoutState = createFeatureSelector<CheckoutState>('checkout');

// Address selectors
export const selectShippingAddress = createSelector(
  selectCheckoutState,
  (state) => state.shippingAddress
);

export const selectBillingAddress = createSelector(
  selectCheckoutState,
  (state) => state.billingAddress
);

export const selectSameAsShipping = createSelector(
  selectCheckoutState,
  (state) => state.sameAsShipping
);

export const selectOrderNotes = createSelector(
  selectCheckoutState,
  (state) => state.notes
);

// Checkout flow selectors
export const selectCurrentStep = createSelector(
  selectCheckoutState,
  (state) => state.currentStep
);

export const selectSteps = createSelector(
  selectCheckoutState,
  (state) => state.steps
);

// Validation selectors
export const selectShippingValid = createSelector(
  selectCheckoutState,
  (state) => state.shippingValid
);

export const selectBillingValid = createSelector(
  selectCheckoutState,
  (state) => state.billingValid
);

export const selectCanProceedFromStep1 = createSelector(
  selectShippingValid,
  selectBillingValid,
  selectSameAsShipping,
  (shippingValid, billingValid, sameAsShipping) => 
    shippingValid && (sameAsShipping || billingValid)
);

// Order selectors
export const selectCurrentOrder = createSelector(
  selectCheckoutState,
  (state) => state.currentOrder
);

export const selectOrders = createSelector(
  selectCheckoutState,
  (state) => state.orders
);

// Loading selectors
export const selectLoading = createSelector(
  selectCheckoutState,
  (state) => state.loading
);

export const selectCreatingOrder = createSelector(
  selectCheckoutState,
  (state) => state.creatingOrder
);

export const selectLoadingOrder = createSelector(
  selectCheckoutState,
  (state) => state.loadingOrder
);

export const selectLoadingOrders = createSelector(
  selectCheckoutState,
  (state) => state.loadingOrders
);

export const selectAnyLoading = createSelector(
  selectLoading,
  selectCreatingOrder,
  selectLoadingOrder,
  selectLoadingOrders,
  (loading, creatingOrder, loadingOrder, loadingOrders) =>
    loading || creatingOrder || loadingOrder || loadingOrders
);

// Error selectors
export const selectError = createSelector(
  selectCheckoutState,
  (state) => state.error
);

export const selectOrderError = createSelector(
  selectCheckoutState,
  (state) => state.orderError
);

export const selectAnyError = createSelector(
  selectError,
  selectOrderError,
  (error, orderError) => error || orderError
);

// Combined selectors
export const selectCheckoutData = createSelector(
  selectShippingAddress,
  selectBillingAddress,
  selectSameAsShipping,
  selectOrderNotes,
  (shippingAddress, billingAddress, sameAsShipping, notes) => ({
    shippingAddress,
    billingAddress,
    sameAsShipping,
    notes
  })
);

export const selectCheckoutProgress = createSelector(
  selectCurrentStep,
  selectSteps,
  selectCanProceedFromStep1,
  (currentStep, steps, canProceed) => ({
    currentStep,
    steps,
    canProceed,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === steps.length,
    isComplete: currentStep === steps.length
  })
);