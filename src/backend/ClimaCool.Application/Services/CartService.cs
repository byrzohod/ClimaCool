using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ClimaCool.Application.DTOs.Cart;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace ClimaCool.Application.Services
{
    public class CartService : ICartService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<CartService> _logger;
        private const int CartExpirationDays = 7;
        private const int AuthenticatedCartExpirationDays = 30;

        public CartService(
            IUnitOfWork unitOfWork,
            IProductRepository productRepository,
            IMapper mapper,
            ILogger<CartService> logger)
        {
            _unitOfWork = unitOfWork;
            _productRepository = productRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<CartDto?> GetCartAsync(Guid? userId, string sessionId)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            if (cart == null)
                return null;

            // Update last accessed time
            cart.LastAccessedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();

            return MapCartToDto(cart);
        }

        public async Task<CartDto> AddToCartAsync(Guid? userId, string sessionId, AddToCartDto dto)
        {
            var cart = await GetOrCreateCartAsync(userId, sessionId);
            var product = await _productRepository.GetByIdAsync(dto.ProductId);
            
            if (product == null)
                throw new ApplicationException($"Product {dto.ProductId} not found");

            if (!product.IsActive || product.IsDeleted)
                throw new ApplicationException($"Product {dto.ProductId} is not available");

            if (product.StockQuantity < dto.Quantity)
                throw new ApplicationException($"Insufficient stock for product {product.Name}");

            decimal price = product.Price;
            
            // Handle variant pricing if specified
            if (dto.ProductVariantId.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == dto.ProductVariantId.Value);
                if (variant == null)
                    throw new ApplicationException($"Product variant {dto.ProductVariantId} not found");
                    
                if (variant.StockQuantity < dto.Quantity)
                    throw new ApplicationException($"Insufficient stock for variant {variant.Name}");
                    
                price = variant.Price;
            }

            cart.AddItem(product, dto.Quantity, price);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Added {Quantity} of product {ProductId} to cart for user/session {UserId}/{SessionId}", 
                dto.Quantity, dto.ProductId, userId, sessionId);

            return MapCartToDto(cart);
        }

        public async Task<CartDto> UpdateCartItemAsync(Guid? userId, string sessionId, int productId, UpdateCartItemDto dto)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            if (cart == null)
                throw new ApplicationException("Cart not found");

            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new ApplicationException($"Product {productId} not found");

            if (dto.Quantity > 0 && product.StockQuantity < dto.Quantity)
                throw new ApplicationException($"Insufficient stock for product {product.Name}");

            cart.UpdateItemQuantity(productId, dto.Quantity);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Updated quantity for product {ProductId} in cart for user/session {UserId}/{SessionId}", 
                productId, userId, sessionId);

            return MapCartToDto(cart);
        }

        public async Task<CartDto> RemoveFromCartAsync(Guid? userId, string sessionId, int productId)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            if (cart == null)
                throw new ApplicationException("Cart not found");

            cart.RemoveItem(productId);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Removed product {ProductId} from cart for user/session {UserId}/{SessionId}", 
                productId, userId, sessionId);

            return MapCartToDto(cart);
        }

        public async Task<CartDto> ClearCartAsync(Guid? userId, string sessionId)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            if (cart == null)
                throw new ApplicationException("Cart not found");

            cart.Clear();
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Cleared cart for user/session {UserId}/{SessionId}", userId, sessionId);

            return MapCartToDto(cart);
        }

        public async Task<CartSummaryDto> GetCartSummaryAsync(Guid? userId, string sessionId)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            if (cart == null)
                return new CartSummaryDto { ItemCount = 0, SubTotal = 0 };

            return new CartSummaryDto
            {
                ItemCount = cart.ItemCount,
                SubTotal = cart.SubTotal
            };
        }

        public async Task<bool> MergeCartsAsync(Guid userId, string sessionId)
        {
            var result = await _unitOfWork.Carts.MergeCartsAsync(userId, sessionId);
            if (result)
            {
                await _unitOfWork.CompleteAsync();
                _logger.LogInformation("Merged carts for user {UserId} with session {SessionId}", userId, sessionId);
            }
            return result;
        }

        public async Task CleanupExpiredCartsAsync()
        {
            await _unitOfWork.Carts.RemoveExpiredCartsAsync();
            await _unitOfWork.CompleteAsync();
            _logger.LogInformation("Cleaned up expired carts");
        }

        private async Task<Cart> GetOrCreateCartAsync(Guid? userId, string sessionId)
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, sessionId);
            
            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    SessionId = sessionId,
                    ExpiresAt = DateTime.UtcNow.AddDays(
                        !userId.HasValue ? CartExpirationDays : AuthenticatedCartExpirationDays),
                    LastAccessedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                
                await _unitOfWork.Carts.AddAsync(cart);
                await _unitOfWork.CompleteAsync();
                
                _logger.LogInformation("Created new cart for user/session {UserId}/{SessionId}", userId, sessionId);
            }
            
            return cart;
        }

        private CartDto MapCartToDto(Cart cart)
        {
            var dto = _mapper.Map<CartDto>(cart);
            
            // Map additional item details
            foreach (var item in dto.Items)
            {
                var cartItem = cart.Items.First(i => i.Id == item.Id);
                item.ProductName = cartItem.Product.Name;
                item.ProductSlug = cartItem.Product.Slug;
                item.ProductImageUrl = cartItem.Product.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl;
                item.AvailableStock = cartItem.ProductVariantId.HasValue && cartItem.ProductVariant != null
                    ? cartItem.ProductVariant.StockQuantity
                    : cartItem.Product.StockQuantity;
                    
                if (cartItem.ProductVariant != null)
                {
                    item.VariantName = cartItem.ProductVariant.Name;
                }
            }
            
            return dto;
        }
    }
}