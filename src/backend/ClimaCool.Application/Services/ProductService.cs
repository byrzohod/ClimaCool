using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using ClimaCool.Application.Common;
using ClimaCool.Application.DTOs.Product;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Application.Extensions;
using Microsoft.Extensions.Logging;

namespace ClimaCool.Application.Services
{
    public class ProductService : IProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IProductRepository _productRepository;
        // TODO: Add back ISearchService when OpenSearch integration is complete
        private readonly IMapper _mapper;
        private readonly ILogger<ProductService> _logger;

        public ProductService(
            IUnitOfWork unitOfWork,
            IProductRepository productRepository,
            IMapper mapper,
            ILogger<ProductService> logger)
        {
            _unitOfWork = unitOfWork;
            _productRepository = productRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PagedResult<ProductListDto>> GetProductsAsync(
            int pageIndex = 1,
            int pageSize = 20,
            string? searchTerm = null,
            int? categoryId = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? sortBy = null,
            bool? inStockOnly = null,
            bool? featuredOnly = null)
        {
            Expression<Func<Product, bool>> filter = p => p.IsActive && !p.IsDeleted;

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                filter = p => p.IsActive && !p.IsDeleted &&
                    (p.Name.ToLower().Contains(searchTerm) ||
                     p.Description!.ToLower().Contains(searchTerm) ||
                     p.SKU.ToLower().Contains(searchTerm));
            }

            if (categoryId.HasValue)
            {
                Expression<Func<Product, bool>> categoryFilter = p => p.CategoryId == categoryId.Value;
                filter = filter.And(categoryFilter);
            }

            if (minPrice.HasValue)
            {
                Expression<Func<Product, bool>> priceFilter = p => p.Price >= minPrice.Value;
                filter = filter.And(priceFilter);
            }

            if (maxPrice.HasValue)
            {
                Expression<Func<Product, bool>> priceFilter = p => p.Price <= maxPrice.Value;
                filter = filter.And(priceFilter);
            }

            if (inStockOnly == true)
            {
                Expression<Func<Product, bool>> stockFilter = p => p.StockQuantity > 0;
                filter = filter.And(stockFilter);
            }

            if (featuredOnly == true)
            {
                Expression<Func<Product, bool>> featuredFilter = p => p.IsFeatured;
                filter = filter.And(featuredFilter);
            }

            Func<IQueryable<Product>, IOrderedQueryable<Product>>? orderBy = sortBy?.ToLower() switch
            {
                "price" => q => q.OrderBy(p => p.Price),
                "price_desc" => q => q.OrderByDescending(p => p.Price),
                "name" => q => q.OrderBy(p => p.Name),
                "name_desc" => q => q.OrderByDescending(p => p.Name),
                "newest" => q => q.OrderByDescending(p => p.CreatedAt),
                "featured" => q => q.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt),
                _ => q => q.OrderByDescending(p => p.CreatedAt)
            };

            var (items, totalCount) = await _productRepository.GetPagedAsync(
                filter, orderBy, pageIndex, pageSize, includeDetails: true);

            var dtos = _mapper.Map<IEnumerable<ProductListDto>>(items);

            // Calculate average ratings
            foreach (var dto in dtos)
            {
                var product = items.First(p => p.Id == dto.Id);
                if (product.Reviews.Any())
                {
                    dto.AverageRating = (decimal)product.Reviews.Average(r => r.Rating);
                    dto.ReviewCount = product.Reviews.Count;
                }
            }

            return new PagedResult<ProductListDto>
            {
                Items = dtos,
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetWithDetailsAsync(id);
            if (product == null) return null;

            var dto = _mapper.Map<ProductDto>(product);
            
            if (product.Reviews.Any())
            {
                dto.AverageRating = (decimal)product.Reviews.Average(r => r.Rating);
                dto.ReviewCount = product.Reviews.Count;
            }

            return dto;
        }

        public async Task<ProductDto?> GetProductBySlugAsync(string slug)
        {
            var product = await _productRepository.GetBySlugAsync(slug);
            if (product == null) return null;

            var dto = _mapper.Map<ProductDto>(product);
            
            if (product.Reviews.Any())
            {
                dto.AverageRating = (decimal)product.Reviews.Average(r => r.Rating);
                dto.ReviewCount = product.Reviews.Count;
            }

            return dto;
        }

        public async Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 10)
        {
            var products = await _productRepository.GetFeaturedProductsAsync(count);
            return _mapper.Map<IEnumerable<ProductListDto>>(products);
        }

        public async Task<IEnumerable<ProductListDto>> GetProductsByCategoryAsync(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return _mapper.Map<IEnumerable<ProductListDto>>(products);
        }

        public async Task<IEnumerable<ProductListDto>> GetRelatedProductsAsync(int productId, int count = 6)
        {
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null) return Enumerable.Empty<ProductListDto>();

            var relatedProducts = await _productRepository.GetByCategoryAsync(product.CategoryId);
            var filtered = relatedProducts
                .Where(p => p.Id != productId)
                .Take(count);

            return _mapper.Map<IEnumerable<ProductListDto>>(filtered);
        }

        public async Task<IEnumerable<ProductListDto>> GetLowStockProductsAsync()
        {
            var products = await _productRepository.GetLowStockProductsAsync();
            return _mapper.Map<IEnumerable<ProductListDto>>(products);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
        {
            // Validate SKU uniqueness
            if (!await _productRepository.IsSkuUniqueAsync(dto.SKU))
            {
                throw new ApplicationException($"SKU '{dto.SKU}' is already in use.");
            }

            var product = _mapper.Map<Product>(dto);
            
            // Generate slug from name
            product.Slug = dto.Name.ToSlug();
            int counter = 1;
            while (!await _productRepository.IsSlugUniqueAsync(product.Slug))
            {
                product.Slug = $"{dto.Name.ToSlug()}-{counter++}";
            }

            product.CreatedAt = DateTime.UtcNow;
            
            await _productRepository.AddAsync(product);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Product created with ID {ProductId}", product.Id);

            // TODO: Index product for search when OpenSearch integration is complete

            return _mapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
            {
                throw new ApplicationException($"Product with ID {id} not found.");
            }

            // Validate SKU uniqueness if changed
            if (dto.SKU != null && product.SKU != dto.SKU && !await _productRepository.IsSkuUniqueAsync(dto.SKU, id))
            {
                throw new ApplicationException($"SKU '{dto.SKU}' is already in use.");
            }

            _mapper.Map(dto, product);
            
            // Update slug if name changed
            if (dto.Name != null && product.Name != dto.Name)
            {
                product.Slug = dto.Name.ToSlug();
                int counter = 1;
                while (!await _productRepository.IsSlugUniqueAsync(product.Slug, id))
                {
                    product.Slug = $"{dto.Name.ToSlug()}-{counter++}";
                }
            }

            product.UpdatedAt = DateTime.UtcNow;
            
            _productRepository.Update(product);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Product {ProductId} updated", product.Id);

            // TODO: Re-index product for search when OpenSearch integration is complete

            return _mapper.Map<ProductDto>(product);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            await _productRepository.SoftDeleteAsync(id);
            await _unitOfWork.CompleteAsync();
            
            _logger.LogInformation("Product {ProductId} soft deleted", id);
            
            // TODO: Remove product from search index when OpenSearch integration is complete
            
            return true;
        }

        public async Task<bool> UpdateStockAsync(int productId, int quantity)
        {
            await _productRepository.UpdateStockAsync(productId, quantity);
            await _unitOfWork.CompleteAsync();
            
            _logger.LogInformation("Stock updated for product {ProductId}: {Quantity}", productId, quantity);
            
            // TODO: Re-index product to update stock status when OpenSearch integration is complete
            
            return true;
        }

        public async Task<bool> AddProductImageAsync(int productId, string imageUrl, string? thumbnailUrl, string? altText, bool isPrimary)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null) return false;

            // If this is marked as primary, unmark other images
            if (isPrimary)
            {
                foreach (var img in product.Images)
                {
                    img.IsPrimary = false;
                }
            }

            var image = new ProductImage
            {
                ProductId = productId,
                ImageUrl = imageUrl,
                ThumbnailUrl = thumbnailUrl,
                AltText = altText,
                IsPrimary = isPrimary || !product.Images.Any(),
                DisplayOrder = product.Images.Count,
                CreatedAt = DateTime.UtcNow
            };

            product.Images.Add(image);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Image added to product {ProductId}", productId);

            return true;
        }

        public async Task<bool> RemoveProductImageAsync(int productId, int imageId)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null) return false;

            var image = product.Images.FirstOrDefault(i => i.Id == imageId);
            if (image == null) return false;

            bool wasPrimary = image.IsPrimary;
            product.Images.Remove(image);

            // If removed image was primary, set another as primary
            if (wasPrimary && product.Images.Any())
            {
                product.Images.First().IsPrimary = true;
            }

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Image {ImageId} removed from product {ProductId}", imageId, productId);

            return true;
        }

        public async Task<bool> SetPrimaryImageAsync(int productId, int imageId)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null) return false;

            foreach (var img in product.Images)
            {
                img.IsPrimary = img.Id == imageId;
            }

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Image {ImageId} set as primary for product {ProductId}", imageId, productId);

            return true;
        }

        public async Task<ProductVariantDto> AddProductVariantAsync(int productId, ProductVariantDto variantDto)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null)
            {
                throw new ApplicationException($"Product with ID {productId} not found.");
            }

            var variant = _mapper.Map<ProductVariant>(variantDto);
            variant.ProductId = productId;
            variant.CreatedAt = DateTime.UtcNow;

            product.Variants.Add(variant);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Variant added to product {ProductId}", productId);

            return _mapper.Map<ProductVariantDto>(variant);
        }

        public async Task<bool> UpdateProductVariantAsync(int productId, ProductVariantDto variantDto)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null) return false;

            var variant = product.Variants.FirstOrDefault(v => v.Id == variantDto.Id);
            if (variant == null) return false;

            _mapper.Map(variantDto, variant);
            variant.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Variant {VariantId} updated for product {ProductId}", variantDto.Id, productId);

            return true;
        }

        public async Task<bool> RemoveProductVariantAsync(int productId, int variantId)
        {
            var product = await _productRepository.GetWithDetailsAsync(productId);
            if (product == null) return false;

            var variant = product.Variants.FirstOrDefault(v => v.Id == variantId);
            if (variant == null) return false;

            product.Variants.Remove(variant);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Variant {VariantId} removed from product {ProductId}", variantId, productId);

            return true;
        }

        public async Task<IEnumerable<string>> GetSearchSuggestionsAsync(string query, int maxSuggestions = 10)
        {
            try
            {
                query = query.ToLower().Trim();
                
                // Get suggestions from product names, brands, and categories
                var productSuggestions = await _productRepository.GetPagedAsync(
                    p => p.IsActive && 
                         (p.Name.ToLower().Contains(query) || 
                          p.Brand!.ToLower().Contains(query) ||
                          p.Category.Name.ToLower().Contains(query)),
                    q => q.OrderBy(p => p.Name),
                    1, maxSuggestions * 2); // Get more to filter

                var suggestions = new List<string>();
                
                // Add product names
                suggestions.AddRange(productSuggestions.Items
                    .Where(p => p.Name.ToLower().Contains(query))
                    .Select(p => p.Name)
                    .Distinct());

                // Add brand names
                suggestions.AddRange(productSuggestions.Items
                    .Where(p => !string.IsNullOrEmpty(p.Brand) && p.Brand.ToLower().Contains(query))
                    .Select(p => p.Brand!)
                    .Distinct());

                // Add category names
                suggestions.AddRange(productSuggestions.Items
                    .Where(p => p.Category.Name.ToLower().Contains(query))
                    .Select(p => p.Category.Name)
                    .Distinct());

                return suggestions
                    .Distinct()
                    .Take(maxSuggestions)
                    .OrderBy(s => s);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
                return [];
            }
        }
    }
}