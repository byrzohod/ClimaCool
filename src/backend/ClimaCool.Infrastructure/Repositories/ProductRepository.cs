using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Infrastructure.Data;
using ClimaCool.Infrastructure.Extensions;

namespace ClimaCool.Infrastructure.Repositories
{
    public class ProductRepository : CatalogRepository<Product>, IProductRepository
    {
        public ProductRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Product?> GetBySlugAsync(string slug)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .Include(p => p.Attributes)
                .FirstOrDefaultAsync(p => p.Slug == slug && !p.IsDeleted);
        }

        public async Task<Product?> GetWithDetailsAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
                .Include(p => p.Variants)
                    .ThenInclude(v => v.Attributes)
                .Include(p => p.Attributes.OrderBy(a => a.DisplayOrder))
                .Include(p => p.Reviews)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId, bool includeInactive = false)
        {
            var query = _context.Products
                .Include(p => p.Images.Where(i => i.IsPrimary))
                .Where(p => p.CategoryId == categoryId && !p.IsDeleted);

            if (!includeInactive)
                query = query.Where(p => p.IsActive);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetFeaturedProductsAsync(int count = 10)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images.Where(i => i.IsPrimary))
                .Where(p => p.IsFeatured && p.IsActive && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> SearchAsync(
            string searchTerm,
            int? categoryId = null,
            decimal? minPrice = null,
            decimal? maxPrice = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images.Where(i => i.IsPrimary))
                .Where(p => p.IsActive && !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Description!.ToLower().Contains(searchTerm) ||
                    p.SKU.ToLower().Contains(searchTerm) ||
                    p.Brand!.ToLower().Contains(searchTerm) ||
                    p.Model!.ToLower().Contains(searchTerm));
            }

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            if (minPrice.HasValue)
                query = query.Where(p => p.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => p.Price <= maxPrice.Value);

            return await query.ToListAsync();
        }

        public async Task<bool> IsSkuUniqueAsync(string sku, int? excludeProductId = null)
        {
            var query = _context.Products.Where(p => p.SKU == sku && !p.IsDeleted);
            
            if (excludeProductId.HasValue)
                query = query.Where(p => p.Id != excludeProductId.Value);

            return !await query.AnyAsync();
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, int? excludeProductId = null)
        {
            var query = _context.Products.Where(p => p.Slug == slug && !p.IsDeleted);
            
            if (excludeProductId.HasValue)
                query = query.Where(p => p.Id != excludeProductId.Value);

            return !await query.AnyAsync();
        }

        public async Task UpdateStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null)
            {
                product.StockQuantity = quantity;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.TrackInventory &&
                           p.LowStockThreshold.HasValue &&
                           p.StockQuantity <= p.LowStockThreshold.Value &&
                           p.IsActive &&
                           !p.IsDeleted)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();
        }

        public async Task SoftDeleteAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                product.IsDeleted = true;
                product.DeletedAt = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(IEnumerable<Product> Items, int TotalCount)> GetPagedAsync(
            Expression<Func<Product, bool>>? filter = null,
            Func<IQueryable<Product>, IOrderedQueryable<Product>>? orderBy = null,
            int pageIndex = 1,
            int pageSize = 20,
            bool includeDetails = false)
        {
            var query = _context.Products.Where(p => !p.IsDeleted);

            if (filter != null)
                query = query.Where(filter);

            if (includeDetails)
            {
                query = query
                    .Include(p => p.Category)
                    .Include(p => p.Images.Where(i => i.IsPrimary))
                    .Include(p => p.Variants);
            }

            var totalCount = await query.CountAsync();

            if (orderBy != null)
                query = orderBy(query);
            else
                query = query.OrderByDescending(p => p.CreatedAt);

            var items = await query
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}