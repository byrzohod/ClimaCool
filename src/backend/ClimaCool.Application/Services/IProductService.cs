using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Common;

namespace ClimaCool.Application.Services
{
    public interface IProductService
    {
        Task<PagedResult<ProductListDto>> GetProductsAsync(
            int pageIndex = 1,
            int pageSize = 20,
            string? searchTerm = null,
            int? categoryId = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? sortBy = null,
            bool? inStockOnly = null,
            bool? featuredOnly = null);
        
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto?> GetProductBySlugAsync(string slug);
        Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 10);
        Task<IEnumerable<ProductListDto>> GetProductsByCategoryAsync(int categoryId);
        Task<IEnumerable<ProductListDto>> GetRelatedProductsAsync(int productId, int count = 6);
        Task<IEnumerable<ProductListDto>> GetLowStockProductsAsync();
        Task<IEnumerable<string>> GetSearchSuggestionsAsync(string query, int maxSuggestions = 10);
        Task<ProductDto> CreateProductAsync(CreateProductDto dto);
        Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id);
        Task<bool> UpdateStockAsync(int productId, int quantity);
        Task<bool> AddProductImageAsync(int productId, string imageUrl, string? thumbnailUrl, string? altText, bool isPrimary);
        Task<bool> RemoveProductImageAsync(int productId, int imageId);
        Task<bool> SetPrimaryImageAsync(int productId, int imageId);
        Task<ProductVariantDto> AddProductVariantAsync(int productId, ProductVariantDto variant);
        Task<bool> UpdateProductVariantAsync(int productId, ProductVariantDto variant);
        Task<bool> RemoveProductVariantAsync(int productId, int variantId);
    }
}