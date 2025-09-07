export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}