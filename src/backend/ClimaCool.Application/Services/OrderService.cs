using AutoMapper;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace ClimaCool.Application.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICartService _cartService;
    private readonly IMapper _mapper;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IUnitOfWork unitOfWork,
        ICartService cartService,
        IMapper mapper,
        ILogger<OrderService> logger)
    {
        _unitOfWork = unitOfWork;
        _cartService = cartService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderRequest request)
    {
        try
        {
            var cart = await _unitOfWork.Carts.GetActiveCartAsync(userId, string.Empty);
            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Cart is empty or does not exist");
            }

            // Create addresses
            var shippingAddress = new Address
            {
                UserId = userId,
                FirstName = request.ShippingAddress.FirstName,
                LastName = request.ShippingAddress.LastName,
                Company = request.ShippingAddress.Company,
                AddressLine1 = request.ShippingAddress.AddressLine1,
                AddressLine2 = request.ShippingAddress.AddressLine2,
                City = request.ShippingAddress.City,
                State = request.ShippingAddress.State,
                PostalCode = request.ShippingAddress.PostalCode,
                Country = request.ShippingAddress.Country,
                PhoneNumber = request.ShippingAddress.PhoneNumber,
                Type = AddressType.Shipping
            };

            var billingAddress = new Address
            {
                UserId = userId,
                FirstName = request.BillingAddress.FirstName,
                LastName = request.BillingAddress.LastName,
                Company = request.BillingAddress.Company,
                AddressLine1 = request.BillingAddress.AddressLine1,
                AddressLine2 = request.BillingAddress.AddressLine2,
                City = request.BillingAddress.City,
                State = request.BillingAddress.State,
                PostalCode = request.BillingAddress.PostalCode,
                Country = request.BillingAddress.Country,
                PhoneNumber = request.BillingAddress.PhoneNumber,
                Type = AddressType.Billing
            };

            await _unitOfWork.Addresses.AddAsync(shippingAddress);
            await _unitOfWork.Addresses.AddAsync(billingAddress);

            // Generate order number
            var orderNumber = await GenerateOrderNumberAsync();

            // Create order
            var order = new Order
            {
                UserId = userId,
                OrderNumber = orderNumber,
                Status = OrderStatus.Pending,
                SubTotal = cart.SubTotal,
                TaxAmount = 0, // TODO: Calculate tax
                ShippingAmount = 0, // TODO: Calculate shipping
                TotalAmount = cart.SubTotal,
                ShippingAddressId = shippingAddress.Id,
                BillingAddressId = billingAddress.Id,
                Notes = request.Notes
            };

            await _unitOfWork.Orders.AddAsync(order);

            // Create order items from cart items
            foreach (var cartItem in cart.Items)
            {
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = cartItem.ProductId,
                    ProductVariantId = cartItem.ProductVariantId,
                    ProductName = cartItem.Product.Name,
                    ProductSku = cartItem.ProductVariant?.SKU ?? cartItem.Product.SKU,
                    VariantName = cartItem.ProductVariant?.Name,
                    UnitPrice = cartItem.Price,
                    Quantity = cartItem.Quantity,
                    ProductDescription = cartItem.Product.ShortDescription,
                    ProductImageUrl = cartItem.Product.Images?.FirstOrDefault()?.ImageUrl
                };

                order.Items.Add(orderItem);
            }

            // Clear the cart
            await _unitOfWork.Carts.DeleteAsync(cart);

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Order {OrderNumber} created for user {UserId}", orderNumber, userId);

            return _mapper.Map<OrderDto>(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order for user {UserId}", userId);
            throw;
        }
    }

    public async Task<OrderDto> GetOrderAsync(Guid userId, Guid orderId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        if (order == null || order.UserId != userId)
        {
            throw new UnauthorizedAccessException("Order not found or access denied");
        }

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId, int page = 1, int pageSize = 10)
    {
        var orders = await _unitOfWork.Orders.GetUserOrdersAsync(userId, page, pageSize);
        return _mapper.Map<IEnumerable<OrderDto>>(orders);
    }

    public async Task<bool> CancelOrderAsync(Guid userId, Guid orderId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        if (order == null || order.UserId != userId)
        {
            return false;
        }

        if (order.Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException("Only pending orders can be cancelled");
        }

        order.Status = OrderStatus.Cancelled;
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("Order {OrderNumber} cancelled by user {UserId}", order.OrderNumber, userId);

        return true;
    }

    private Task<string> GenerateOrderNumberAsync()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return Task.FromResult($"CC-{timestamp}-{random}");
    }
}