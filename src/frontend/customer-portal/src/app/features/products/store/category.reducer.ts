import { createReducer, on } from '@ngrx/store';
import { CategoryState, initialCategoryState } from './category.state';
import * as CategoryActions from './category.actions';

export const categoryReducer = createReducer(
  initialCategoryState,

  // Load Categories
  on(CategoryActions.loadCategories, (state) => ({
    ...state,
    loadingCategories: true,
    error: null
  })),

  on(CategoryActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
    loadingCategories: false,
    error: null
  })),

  on(CategoryActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loadingCategories: false,
    error
  })),

  // Load Category Hierarchy
  on(CategoryActions.loadCategoryHierarchy, (state) => ({
    ...state,
    loadingHierarchy: true,
    error: null
  })),

  on(CategoryActions.loadCategoryHierarchySuccess, (state, { hierarchy }) => ({
    ...state,
    hierarchy,
    loadingHierarchy: false,
    error: null
  })),

  on(CategoryActions.loadCategoryHierarchyFailure, (state, { error }) => ({
    ...state,
    loadingHierarchy: false,
    error
  })),

  // Load Category Details
  on(CategoryActions.loadCategory, (state) => ({
    ...state,
    loadingSelectedCategory: true,
    error: null
  })),

  on(CategoryActions.loadCategorySuccess, (state, { category }) => ({
    ...state,
    selectedCategory: category,
    loadingSelectedCategory: false,
    error: null
  })),

  on(CategoryActions.loadCategoryFailure, (state, { error }) => ({
    ...state,
    loadingSelectedCategory: false,
    error
  })),

  // Set Selected Category
  on(CategoryActions.setSelectedCategory, (state, { categoryId }) => ({
    ...state,
    selectedCategoryId: categoryId || null
  })),

  on(CategoryActions.clearSelectedCategory, (state) => ({
    ...state,
    selectedCategory: null,
    selectedCategoryId: null
  }))
);