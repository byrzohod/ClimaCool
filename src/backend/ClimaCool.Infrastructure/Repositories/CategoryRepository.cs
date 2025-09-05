using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Infrastructure.Repositories
{
    public class CategoryRepository : CatalogRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Category?> GetBySlugAsync(string slug)
        {
            return await _context.Categories
                .Include(c => c.ParentCategory)
                .Include(c => c.ChildCategories)
                .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive);
        }

        public async Task<Category?> GetWithChildrenAsync(int id)
        {
            return await _context.Categories
                .Include(c => c.ChildCategories)
                    .ThenInclude(cc => cc.ChildCategories)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Category?> GetWithDetailsAsync(int id)
        {
            return await _context.Categories
                .Include(c => c.ParentCategory)
                .Include(c => c.ChildCategories.Where(cc => cc.IsActive))
                .Include(c => c.Products.Where(p => p.IsActive && !p.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Category>> GetAllWithDetailsAsync()
        {
            return await _context.Categories
                .Include(c => c.ParentCategory)
                .Include(c => c.ChildCategories.Where(cc => cc.IsActive))
                .Include(c => c.Products.Where(p => p.IsActive && !p.IsDeleted))
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetChildCategoriesAsync(int parentId)
        {
            return await _context.Categories
                .Include(c => c.Products.Where(p => p.IsActive && !p.IsDeleted))
                .Where(c => c.ParentCategoryId == parentId && c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetHierarchyAsync()
        {
            var categories = await _context.Categories
                .Include(c => c.ChildCategories)
                    .ThenInclude(cc => cc.ChildCategories)
                        .ThenInclude(ccc => ccc.ChildCategories)
                .Where(c => c.ParentCategoryId == null && c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();

            return categories;
        }

        public async Task<IEnumerable<Category>> GetRootCategoriesAsync()
        {
            return await _context.Categories
                .Where(c => c.ParentCategoryId == null && c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetActiveAsync()
        {
            return await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, int? excludeCategoryId = null)
        {
            var query = _context.Categories.Where(c => c.Slug == slug);
            
            if (excludeCategoryId.HasValue)
                query = query.Where(c => c.Id != excludeCategoryId.Value);

            return !await query.AnyAsync();
        }

        public async Task<bool> HasProductsAsync(int categoryId)
        {
            return await _context.Products
                .AnyAsync(p => p.CategoryId == categoryId && !p.IsDeleted);
        }

        public async Task<int> GetProductCountAsync(int categoryId)
        {
            // Get count including subcategories
            var categoryIds = new List<int> { categoryId };
            await GetAllSubcategoryIds(categoryId, categoryIds);

            return await _context.Products
                .CountAsync(p => categoryIds.Contains(p.CategoryId) && 
                                p.IsActive && 
                                !p.IsDeleted);
        }

        private async Task GetAllSubcategoryIds(int parentId, List<int> categoryIds)
        {
            var childIds = await _context.Categories
                .Where(c => c.ParentCategoryId == parentId)
                .Select(c => c.Id)
                .ToListAsync();

            categoryIds.AddRange(childIds);

            foreach (var childId in childIds)
            {
                await GetAllSubcategoryIds(childId, categoryIds);
            }
        }

        public async Task UpdateDisplayOrderAsync(int categoryId, int displayOrder)
        {
            var category = await _context.Categories.FindAsync(categoryId);
            if (category != null)
            {
                category.DisplayOrder = displayOrder;
                category.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> CanDeleteAsync(int categoryId)
        {
            // Can't delete if has products
            if (await HasProductsAsync(categoryId))
                return false;

            // Can't delete if has child categories
            var hasChildren = await _context.Categories
                .AnyAsync(c => c.ParentCategoryId == categoryId);

            return !hasChildren;
        }
    }
}