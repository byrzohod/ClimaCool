using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Services;
using Microsoft.AspNetCore.Http;

namespace ClimaCool.Application.Interfaces;

public interface IAdminProductService
{
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
    Task<BulkOperationResult> BulkUpdateProductsAsync(BulkUpdateProductsDto dto);
    Task<BulkOperationResult> BulkDeleteProductsAsync(List<Guid> productIds);
    Task<string> UploadProductImageAsync(Guid productId, IFormFile file);
    Task<bool> DeleteProductImageAsync(Guid productId, string imageUrl);
    Task<ImportResult> ImportProductsFromCsvAsync(IFormFile file);
    Task<byte[]> ExportProductsToCsvAsync(ProductFilterRequest filter);
    Task<InventoryUpdateResult> UpdateInventoryAsync(List<InventoryUpdateDto> updates);
}