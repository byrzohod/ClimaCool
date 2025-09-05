import { createAction, props } from '@ngrx/store';
import { Category, CategoryListItem } from '../../../core/models/category.model';

// Load Categories Actions
export const loadCategories = createAction('[Category] Load Categories');

export const loadCategoriesSuccess = createAction(
  '[Category] Load Categories Success',
  props<{ categories: Category[] }>()
);

export const loadCategoriesFailure = createAction(
  '[Category] Load Categories Failure',
  props<{ error: string }>()
);

// Load Category Hierarchy Actions
export const loadCategoryHierarchy = createAction('[Category] Load Category Hierarchy');

export const loadCategoryHierarchySuccess = createAction(
  '[Category] Load Category Hierarchy Success',
  props<{ hierarchy: Category[] }>()
);

export const loadCategoryHierarchyFailure = createAction(
  '[Category] Load Category Hierarchy Failure',
  props<{ error: string }>()
);

// Load Category Details Actions
export const loadCategory = createAction(
  '[Category] Load Category',
  props<{ id?: number; slug?: string }>()
);

export const loadCategorySuccess = createAction(
  '[Category] Load Category Success',
  props<{ category: Category }>()
);

export const loadCategoryFailure = createAction(
  '[Category] Load Category Failure',
  props<{ error: string }>()
);

// Set Selected Category Actions
export const setSelectedCategory = createAction(
  '[Category] Set Selected Category',
  props<{ categoryId?: number }>()
);

export const clearSelectedCategory = createAction('[Category] Clear Selected Category');