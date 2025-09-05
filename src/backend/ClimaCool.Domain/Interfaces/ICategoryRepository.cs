using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces
{
    public interface ICategoryRepository : ICatalogRepository<Category>
    {
        Task<Category?> GetBySlugAsync(string slug);
        Task<Category?> GetWithChildrenAsync(int id);
        Task<Category?> GetWithDetailsAsync(int id);
        Task<IEnumerable<Category>> GetAllWithDetailsAsync();
        Task<IEnumerable<Category>> GetHierarchyAsync();
        Task<IEnumerable<Category>> GetRootCategoriesAsync();
        Task<IEnumerable<Category>> GetChildCategoriesAsync(int parentId);
        Task<IEnumerable<Category>> GetActiveAsync();
        Task<bool> IsSlugUniqueAsync(string slug, int? excludeCategoryId = null);
        Task<bool> HasProductsAsync(int categoryId);
        Task<int> GetProductCountAsync(int categoryId);
        Task UpdateDisplayOrderAsync(int categoryId, int displayOrder);
        Task<bool> CanDeleteAsync(int categoryId);
    }
}