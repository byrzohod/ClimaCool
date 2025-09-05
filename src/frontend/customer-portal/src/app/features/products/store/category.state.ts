import { Category } from '../../../core/models/category.model';

export interface CategoryState {
  categories: Category[];
  hierarchy: Category[];
  selectedCategory: Category | null;
  selectedCategoryId: number | null;
  loading: boolean;
  error: string | null;
  
  // Loading states for specific operations
  loadingCategories: boolean;
  loadingHierarchy: boolean;
  loadingSelectedCategory: boolean;
}

export const initialCategoryState: CategoryState = {
  categories: [],
  hierarchy: [],
  selectedCategory: null,
  selectedCategoryId: null,
  loading: false,
  error: null,
  loadingCategories: false,
  loadingHierarchy: false,
  loadingSelectedCategory: false
};