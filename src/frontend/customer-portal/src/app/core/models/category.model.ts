export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  childCategories: Category[];
  productCount: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount: number;
  hasChildren: boolean;
  displayOrder: number;
}

export interface CategoryHierarchy {
  id: number;
  name: string;
  slug: string;
  level: number;
  children: CategoryHierarchy[];
}