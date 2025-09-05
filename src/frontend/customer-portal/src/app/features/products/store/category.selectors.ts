import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoryState } from './category.state';

export const selectCategoryState = createFeatureSelector<CategoryState>('categories');

// Categories Selectors
export const selectCategories = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.categories
);

export const selectCategoriesLoading = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.loadingCategories
);

// Category Hierarchy Selectors
export const selectCategoryHierarchy = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.hierarchy
);

export const selectCategoryHierarchyLoading = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.loadingHierarchy
);

// Root Categories (categories without parent)
export const selectRootCategories = createSelector(
  selectCategories,
  (categories) => categories.filter(category => !category.parentCategoryId)
);

// Selected Category Selectors
export const selectSelectedCategory = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.selectedCategory
);

export const selectSelectedCategoryId = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.selectedCategoryId
);

export const selectSelectedCategoryLoading = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.loadingSelectedCategory
);

// Category by ID Selector (factory)
export const selectCategoryById = (categoryId: number) => createSelector(
  selectCategories,
  (categories) => categories.find(category => category.id === categoryId)
);

// Categories with products count
export const selectCategoriesWithProducts = createSelector(
  selectCategories,
  (categories) => categories.filter(category => category.productCount > 0)
);

// Child categories for a specific parent
export const selectChildCategories = (parentId: number) => createSelector(
  selectCategories,
  (categories) => categories.filter(category => category.parentCategoryId === parentId)
);

// Error and Loading Selectors
export const selectCategoryError = createSelector(
  selectCategoryState,
  (state: CategoryState) => state.error
);

export const selectAnyCategoryLoading = createSelector(
  selectCategoryState,
  (state: CategoryState) => 
    state.loadingCategories || 
    state.loadingHierarchy || 
    state.loadingSelectedCategory
);