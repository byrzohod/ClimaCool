using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces
{
    public interface IProductRepository : ICatalogRepository<Product>
    {
        Task<Product?> GetBySlugAsync(string slug);
        Task<Product?> GetWithDetailsAsync(int id);
        Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId, bool includeInactive = false);
        Task<IEnumerable<Product>> GetFeaturedProductsAsync(int count = 10);
        Task<IEnumerable<Product>> SearchAsync(string searchTerm, int? categoryId = null, decimal? minPrice = null, decimal? maxPrice = null);
        Task<bool> IsSkuUniqueAsync(string sku, int? excludeProductId = null);
        Task<bool> IsSlugUniqueAsync(string slug, int? excludeProductId = null);
        Task UpdateStockAsync(int productId, int quantity);
        Task<IEnumerable<Product>> GetLowStockProductsAsync();
        Task SoftDeleteAsync(int id);
        Task<(IEnumerable<Product> Items, int TotalCount)> GetPagedAsync(
            Expression<Func<Product, bool>>? filter = null,
            Func<IQueryable<Product>, IOrderedQueryable<Product>>? orderBy = null,
            int pageIndex = 1,
            int pageSize = 20,
            bool includeDetails = false);
    }
}