using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Services;
using Microsoft.AspNetCore.Http;

namespace ClimaCool.Application.Interfaces;

public interface IAdminProductService
{
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(int id);
    Task<BulkOperationResult> BulkUpdateProductsAsync(BulkUpdateProductsDto dto);
    Task<BulkOperationResult> BulkDeleteProductsAsync(List<int> productIds);
    Task<string> UploadProductImageAsync(int productId, IFormFile file);
    Task<bool> DeleteProductImageAsync(int productId, string imageUrl);
    Task<ImportResult> ImportProductsFromCsvAsync(IFormFile file);
    Task<byte[]> ExportProductsToCsvAsync(ProductFilterRequest filter);
    Task<InventoryUpdateResult> UpdateInventoryAsync(List<InventoryUpdateDto> updates);
}