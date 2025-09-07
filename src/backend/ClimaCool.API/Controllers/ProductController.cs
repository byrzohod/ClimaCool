using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Services;
using ClimaCool.Application.Validators.Product;
using Microsoft.Extensions.Logging;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly CreateProductValidator _createValidator;
        private readonly UpdateProductValidator _updateValidator;
        private readonly ILogger<ProductController> _logger;

        public ProductController(
            IProductService productService,
            CreateProductValidator createValidator,
            UpdateProductValidator updateValidator,
            ILogger<ProductController> logger)
        {
            _productService = productService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool? inStockOnly = null,
            [FromQuery] bool? featuredOnly = null)
        {
            try
            {
                var result = await _productService.GetProductsAsync(
                    pageIndex, pageSize, search, categoryId, minPrice, maxPrice, sortBy, inStockOnly, featuredOnly);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting products");
                return StatusCode(500, new { message = "An error occurred while retrieving products" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetProductBySlug(string slug)
        {
            try
            {
                var product = await _productService.GetProductBySlugAsync(slug);
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product by slug {Slug}", slug);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
            }
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts([FromQuery] int count = 10)
        {
            try
            {
                var products = await _productService.GetFeaturedProductsAsync(count);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured products");
                return StatusCode(500, new { message = "An error occurred while retrieving featured products" });
            }
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetProductsByCategory(int categoryId)
        {
            try
            {
                var products = await _productService.GetProductsByCategoryAsync(categoryId);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting products for category {CategoryId}", categoryId);
                return StatusCode(500, new { message = "An error occurred while retrieving products" });
            }
        }

        [HttpGet("search/suggestions")]
        public async Task<IActionResult> GetSearchSuggestions([FromQuery] string query, [FromQuery] int maxSuggestions = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Query parameter is required" });
            }

            try
            {
                var suggestions = await _productService.GetSearchSuggestionsAsync(query, maxSuggestions);
                return Ok(new { suggestions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
                return StatusCode(500, new { message = "An error occurred while getting suggestions" });
            }
        }

        [HttpGet("{id}/related")]
        public async Task<IActionResult> GetRelatedProducts(int id, [FromQuery] int count = 6)
        {
            try
            {
                var products = await _productService.GetRelatedProductsAsync(id, count);
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting related products for {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving related products" });
            }
        }

        [HttpGet("low-stock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLowStockProducts()
        {
            try
            {
                var products = await _productService.GetLowStockProductsAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting low stock products");
                return StatusCode(500, new { message = "An error occurred while retrieving low stock products" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {
            try
            {
                var validationResult = await _createValidator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
                }

                var product = await _productService.CreateProductAsync(dto);
                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { message = "An error occurred while creating the product" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
        {
            try
            {
                var validationResult = await _updateValidator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
                }

                var product = await _productService.UpdateProductAsync(id, dto);
                return Ok(product);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                if (!result)
                    return NotFound(new { message = "Product not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the product" });
            }
        }

        [HttpPut("{id}/stock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
        {
            try
            {
                var result = await _productService.UpdateStockAsync(id, dto.Quantity);
                if (!result)
                    return NotFound(new { message = "Product not found" });

                return Ok(new { message = "Stock updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock for product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while updating stock" });
            }
        }

        [HttpPost("{id}/images")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddProductImage(int id, [FromBody] AddImageDto dto)
        {
            try
            {
                var result = await _productService.AddProductImageAsync(
                    id, dto.ImageUrl, dto.ThumbnailUrl, dto.AltText, dto.IsPrimary);
                
                if (!result)
                    return NotFound(new { message = "Product not found" });

                return Ok(new { message = "Image added successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding image to product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while adding the image" });
            }
        }

        [HttpDelete("{productId}/images/{imageId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveProductImage(int productId, int imageId)
        {
            try
            {
                var result = await _productService.RemoveProductImageAsync(productId, imageId);
                if (!result)
                    return NotFound(new { message = "Product or image not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing image {ImageId} from product {ProductId}", imageId, productId);
                return StatusCode(500, new { message = "An error occurred while removing the image" });
            }
        }

        [HttpPut("{productId}/images/{imageId}/primary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetPrimaryImage(int productId, int imageId)
        {
            try
            {
                var result = await _productService.SetPrimaryImageAsync(productId, imageId);
                if (!result)
                    return NotFound(new { message = "Product or image not found" });

                return Ok(new { message = "Primary image updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image {ImageId} for product {ProductId}", imageId, productId);
                return StatusCode(500, new { message = "An error occurred while updating the primary image" });
            }
        }
    }

    public class UpdateStockDto
    {
        public int Quantity { get; set; }
    }

    public class AddImageDto
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? AltText { get; set; }
        public bool IsPrimary { get; set; }
    }
}