using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ClimaCool.Application.DTOs.Cart;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ClimaCool.Tests.Services
{
    public class CartServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IProductRepository> _mockProductRepository;
        private readonly Mock<ICartRepository> _mockCartRepository;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ILogger<CartService>> _mockLogger;
        private readonly CartService _cartService;

        public CartServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockProductRepository = new Mock<IProductRepository>();
            _mockCartRepository = new Mock<ICartRepository>();
            _mockMapper = new Mock<IMapper>();
            _mockLogger = new Mock<ILogger<CartService>>();

            _mockUnitOfWork.Setup(u => u.Carts).Returns(_mockCartRepository.Object);

            _cartService = new CartService(
                _mockUnitOfWork.Object,
                _mockProductRepository.Object,
                _mockMapper.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task GetCartAsync_ExistingCart_ReturnsCartDto()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";
            var cart = new Cart
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItem>
                {
                    new CartItem
                    {
                        Id = 1,
                        ProductId = 1,
                        Quantity = 2,
                        Price = 10.99m,
                        Product = new Product
                        {
                            Id = 1,
                            Name = "Test Product",
                            Slug = "test-product",
                            StockQuantity = 10,
                            Images = new List<ProductImage>()
                        }
                    }
                }
            };

            var expectedDto = new CartDto
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItemDto>
                {
                    new CartItemDto
                    {
                        Id = 1,
                        ProductId = 1,
                        Quantity = 2,
                        Price = 10.99m,
                        Total = 21.98m
                    }
                }
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);
            _mockMapper.Setup(m => m.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedDto);

            // Act
            var result = await _cartService.GetCartAsync(userId, sessionId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedDto.Id, result.Id);
            Assert.Equal(expectedDto.UserId, result.UserId);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task GetCartAsync_NoCart_ReturnsNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync((Cart?)null);

            // Act
            var result = await _cartService.GetCartAsync(userId, sessionId);

            // Assert
            Assert.Null(result);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Never);
        }

        [Fact]
        public async Task AddToCartAsync_ValidProduct_AddsItemToCart()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";
            var productId = 1;
            var quantity = 2;

            var product = new Product
            {
                Id = productId,
                Name = "Test Product",
                Price = 10.99m,
                StockQuantity = 10,
                IsActive = true,
                IsDeleted = false,
                Variants = new List<ProductVariant>(),
                Images = new List<ProductImage>()
            };

            var cart = new Cart
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItem>()
            };

            var addToCartDto = new AddToCartDto
            {
                ProductId = productId,
                Quantity = quantity
            };

            var expectedDto = new CartDto
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItemDto>()
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);
            _mockProductRepository.Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync(product);
            _mockMapper.Setup(m => m.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedDto);

            // Act
            var result = await _cartService.AddToCartAsync(userId, sessionId, addToCartDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedDto.Id, result.Id);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once); // Only once for add since cart already exists
        }

        [Fact]
        public async Task AddToCartAsync_InsufficientStock_ThrowsException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";
            var productId = 1;

            var product = new Product
            {
                Id = productId,
                Name = "Test Product",
                Price = 10.99m,
                StockQuantity = 1,
                IsActive = true,
                IsDeleted = false,
                Variants = new List<ProductVariant>()
            };

            var addToCartDto = new AddToCartDto
            {
                ProductId = productId,
                Quantity = 5
            };

            _mockProductRepository.Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync(product);

            // Act & Assert
            await Assert.ThrowsAsync<ApplicationException>(
                () => _cartService.AddToCartAsync(userId, sessionId, addToCartDto)
            );
        }

        [Fact]
        public async Task UpdateCartItemAsync_ValidQuantity_UpdatesItem()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";
            var productId = 1;
            var newQuantity = 3;

            var product = new Product
            {
                Id = productId,
                StockQuantity = 10
            };

            var cart = new Cart
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItem>
                {
                    new CartItem
                    {
                        ProductId = productId,
                        Quantity = 2,
                        Price = 10.99m,
                        Product = product
                    }
                }
            };

            var updateDto = new UpdateCartItemDto
            {
                Quantity = newQuantity
            };

            var expectedDto = new CartDto
            {
                Id = 1,
                Items = new List<CartItemDto>()
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);
            _mockProductRepository.Setup(r => r.GetByIdAsync(productId))
                .ReturnsAsync(product);
            _mockMapper.Setup(m => m.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedDto);

            // Act
            var result = await _cartService.UpdateCartItemAsync(userId, sessionId, productId, updateDto);

            // Assert
            Assert.NotNull(result);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task RemoveFromCartAsync_ExistingItem_RemovesItem()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";
            var productId = 1;

            var cart = new Cart
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItem>
                {
                    new CartItem
                    {
                        ProductId = productId,
                        Quantity = 2,
                        Price = 10.99m,
                        Product = new Product
                        {
                            Id = productId,
                            Name = "Test Product",
                            Images = new List<ProductImage>()
                        }
                    }
                }
            };

            var expectedDto = new CartDto
            {
                Id = 1,
                Items = new List<CartItemDto>()
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);
            _mockMapper.Setup(m => m.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedDto);

            // Act
            var result = await _cartService.RemoveFromCartAsync(userId, sessionId, productId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(cart.Items);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task ClearCartAsync_ExistingCart_ClearsAllItems()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";

            var cart = new Cart
            {
                Id = 1,
                UserId = userId,
                SessionId = sessionId,
                Items = new List<CartItem>
                {
                    new CartItem { ProductId = 1, Quantity = 2, Product = new Product { Images = new List<ProductImage>() } },
                    new CartItem { ProductId = 2, Quantity = 1, Product = new Product { Images = new List<ProductImage>() } }
                }
            };

            var expectedDto = new CartDto
            {
                Id = 1,
                Items = new List<CartItemDto>()
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);
            _mockMapper.Setup(m => m.Map<CartDto>(It.IsAny<Cart>()))
                .Returns(expectedDto);

            // Act
            var result = await _cartService.ClearCartAsync(userId, sessionId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(cart.Items);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }

        [Fact]
        public async Task GetCartSummaryAsync_ExistingCart_ReturnsSummary()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";

            var cart = new Cart
            {
                Id = 1,
                Items = new List<CartItem>
                {
                    new CartItem { Quantity = 2, Price = 10.99m },
                    new CartItem { Quantity = 1, Price = 5.99m }
                }
            };

            _mockCartRepository.Setup(r => r.GetActiveCartAsync(userId, sessionId))
                .ReturnsAsync(cart);

            // Act
            var result = await _cartService.GetCartSummaryAsync(userId, sessionId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.ItemCount);
            Assert.Equal(27.97m, result.SubTotal);
        }

        [Fact]
        public async Task MergeCartsAsync_ValidCarts_MergesSuccessfully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var sessionId = "test-session";

            _mockCartRepository.Setup(r => r.MergeCartsAsync(userId, sessionId))
                .ReturnsAsync(true);

            // Act
            var result = await _cartService.MergeCartsAsync(userId, sessionId);

            // Assert
            Assert.True(result);
            _mockUnitOfWork.Verify(u => u.CompleteAsync(), Times.Once);
        }
    }
}