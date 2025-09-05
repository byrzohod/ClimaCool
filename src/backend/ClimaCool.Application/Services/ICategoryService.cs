using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Application.DTOs.Category;

namespace ClimaCool.Application.Services
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
        Task<IEnumerable<CategoryHierarchyDto>> GetCategoryHierarchyAsync();
        Task<CategoryDto?> GetCategoryByIdAsync(int id);
        Task<CategoryDto?> GetCategoryBySlugAsync(string slug);
        Task<IEnumerable<CategoryListDto>> GetRootCategoriesAsync();
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
        Task<CategoryDto> UpdateCategoryAsync(UpdateCategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);
        Task<bool> UpdateDisplayOrderAsync(int categoryId, int displayOrder);
        Task<int> GetProductCountAsync(int categoryId);
    }
}