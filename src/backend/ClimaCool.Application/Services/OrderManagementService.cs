using AutoMapper;
using ClimaCool.Application.DTOs.Order;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Application.DTOs.Cart;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using System.Linq.Expressions;

namespace ClimaCool.Application.Services;

public interface IOrderManagementService
{
    Task<OrderDto> GetOrderByIdAsync(Guid orderId, Guid? userId = null);
    Task<PagedResult<OrderDto>> GetOrdersAsync(OrderFilterRequest filter);
    Task<PagedResult<OrderDto>> GetUserOrdersAsync(Guid userId, OrderFilterRequest filter);
    Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, OrderStatus newStatus, string? notes = null);
    Task<OrderDto> CancelOrderAsync(Guid orderId, Guid userId, string reason);
    Task<bool> CanCancelOrderAsync(Guid orderId, Guid userId);
    Task<List<OrderStatusHistoryDto>> GetOrderStatusHistoryAsync(Guid orderId);
    Task<OrderStatisticsDto> GetOrderStatisticsAsync(Guid? userId = null);
    Task<OrderDto> ReorderAsync(Guid orderId, Guid userId);
    Task<TrackingInfo> GetTrackingInfoAsync(Guid orderId);
}

public class OrderManagementService : IOrderManagementService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<OrderManagementService> _logger;
    private readonly ICartService _cartService;

    // Define valid status transitions
    private readonly Dictionary<OrderStatus, List<OrderStatus>> _validTransitions = new()
    {
        { OrderStatus.Pending, new List<OrderStatus> { OrderStatus.Confirmed, OrderStatus.Cancelled } },
        { OrderStatus.Confirmed, new List<OrderStatus> { OrderStatus.Processing, OrderStatus.Cancelled } },
        { OrderStatus.Processing, new List<OrderStatus> { OrderStatus.Shipped, OrderStatus.Cancelled } },
        { OrderStatus.Shipped, new List<OrderStatus> { OrderStatus.Delivered, OrderStatus.Refunded } },
        { OrderStatus.Delivered, new List<OrderStatus> { OrderStatus.Refunded } },
        { OrderStatus.Cancelled, new List<OrderStatus>() },
        { OrderStatus.Refunded, new List<OrderStatus>() }
    };

    public OrderManagementService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<OrderManagementService> logger,
        ICartService cartService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _cartService = cartService;
    }

    public async Task<OrderDto> GetOrderByIdAsync(Guid orderId, Guid? userId = null)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        // If userId is provided, verify the order belongs to the user
        if (userId.HasValue && order.UserId != userId.Value)
        {
            throw new UnauthorizedAccessException("You don't have permission to view this order");
        }

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<PagedResult<OrderDto>> GetOrdersAsync(OrderFilterRequest filter)
    {
        Expression<Func<Order, bool>> predicate = o => true;

        // Build filter predicate
        if (filter.Status.HasValue)
        {
            predicate = CombinePredicates(predicate, o => o.Status == filter.Status.Value);
        }

        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            predicate = CombinePredicates(predicate, o => 
                o.OrderNumber.Contains(filter.SearchTerm) ||
                o.User.Email.Contains(filter.SearchTerm));
        }

        if (filter.DateFrom.HasValue)
        {
            predicate = CombinePredicates(predicate, o => o.CreatedAt >= filter.DateFrom.Value);
        }

        if (filter.DateTo.HasValue)
        {
            predicate = CombinePredicates(predicate, o => o.CreatedAt <= filter.DateTo.Value);
        }

        // Get filtered orders
        var allOrders = await _unitOfWork.Orders.FindAsync(predicate);
        var orderedOrders = ApplyOrdering(allOrders, filter.SortBy, filter.SortDescending);
        
        // Manual pagination
        var totalCount = orderedOrders.Count();
        var pagedOrders = orderedOrders
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        var orderDtos = _mapper.Map<List<OrderDto>>(pagedOrders);

        return new PagedResult<OrderDto>
        {
            Items = orderDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<PagedResult<OrderDto>> GetUserOrdersAsync(Guid userId, OrderFilterRequest filter)
    {
        filter.UserId = userId;
        return await GetOrdersAsync(filter);
    }

    public async Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, OrderStatus newStatus, string? notes = null)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        // Validate status transition
        if (!IsValidStatusTransition(order.Status, newStatus))
        {
            throw new InvalidOperationException(
                $"Cannot transition from {order.Status} to {newStatus}");
        }

        // Store old status for history
        var oldStatus = order.Status;

        // Update order status
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        // Update specific timestamps based on status
        switch (newStatus)
        {
            case OrderStatus.Shipped:
                order.ShippedAt = DateTime.UtcNow;
                break;
            case OrderStatus.Delivered:
                order.DeliveredAt = DateTime.UtcNow;
                break;
        }

        // Create status history entry
        // Store status change in order notes for now
        // TODO: Implement OrderStatusHistory repository when needed
        await _unitOfWork.Orders.UpdateAsync(order);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation(
            "Order {OrderId} status updated from {OldStatus} to {NewStatus}", 
            orderId, oldStatus, newStatus);

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> CancelOrderAsync(Guid orderId, Guid userId, string reason)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        if (order.UserId != userId)
        {
            throw new UnauthorizedAccessException("You don't have permission to cancel this order");
        }

        if (!await CanCancelOrderAsync(orderId, userId))
        {
            throw new InvalidOperationException("This order cannot be cancelled");
        }

        return await UpdateOrderStatusAsync(orderId, OrderStatus.Cancelled, $"Cancelled by user: {reason}");
    }

    public async Task<bool> CanCancelOrderAsync(Guid orderId, Guid userId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null || order.UserId != userId)
        {
            return false;
        }

        // Can only cancel orders that are not shipped, delivered, cancelled, or refunded
        return order.Status == OrderStatus.Pending || 
               order.Status == OrderStatus.Confirmed || 
               order.Status == OrderStatus.Processing;
    }

    public async Task<List<OrderStatusHistoryDto>> GetOrderStatusHistoryAsync(Guid orderId)
    {
        // TODO: Implement when OrderStatusHistory repository is available
        return new List<OrderStatusHistoryDto>();
    }

    public async Task<OrderStatisticsDto> GetOrderStatisticsAsync(Guid? userId = null)
    {
        Expression<Func<Order, bool>> predicate = o => true;
        
        if (userId.HasValue)
        {
            predicate = o => o.UserId == userId.Value;
        }

        var orders = await _unitOfWork.Orders.FindAsync(predicate);
        
        return new OrderStatisticsDto
        {
            TotalOrders = orders.Count(),
            PendingOrders = orders.Count(o => o.Status == OrderStatus.Pending),
            ProcessingOrders = orders.Count(o => o.Status == OrderStatus.Processing),
            ShippedOrders = orders.Count(o => o.Status == OrderStatus.Shipped),
            DeliveredOrders = orders.Count(o => o.Status == OrderStatus.Delivered),
            CancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled),
            RefundedOrders = orders.Count(o => o.Status == OrderStatus.Refunded),
            TotalRevenue = orders.Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                                 .Sum(o => o.TotalAmount),
            AverageOrderValue = orders.Any() ? 
                orders.Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Refunded)
                      .Average(o => o.TotalAmount) : 0
        };
    }

    public async Task<OrderDto> ReorderAsync(Guid orderId, Guid userId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        if (order.UserId != userId)
        {
            throw new UnauthorizedAccessException("You don't have permission to reorder this order");
        }

        // Add all items from the order to the cart
        foreach (var item in order.Items)
        {
            await _cartService.AddToCartAsync(userId, string.Empty, new AddToCartDto
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity
            });
        }

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<TrackingInfo> GetTrackingInfoAsync(Guid orderId)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
        
        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        // TODO: Implement when OrderStatusHistory repository is available
        var history = new List<OrderStatusHistory>();

        return new TrackingInfo
        {
            OrderId = orderId,
            OrderNumber = order.OrderNumber,
            CurrentStatus = order.Status,
            StatusHistory = history.Select(h => new TrackingEvent
            {
                Status = h.ToStatus.ToString(),
                Timestamp = h.ChangedAt,
                Description = GetStatusDescription(h.ToStatus),
                Notes = h.Notes
            }).ToList(),
            EstimatedDelivery = CalculateEstimatedDelivery(order),
            TrackingNumber = order.TrackingNumber,
            Carrier = order.Carrier
        };
    }

    private bool IsValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
    {
        if (!_validTransitions.ContainsKey(currentStatus))
        {
            return false;
        }

        return _validTransitions[currentStatus].Contains(newStatus);
    }

    private Expression<Func<Order, bool>> CombinePredicates(
        Expression<Func<Order, bool>> first,
        Expression<Func<Order, bool>> second)
    {
        var parameter = Expression.Parameter(typeof(Order));
        var combined = Expression.AndAlso(
            Expression.Invoke(first, parameter),
            Expression.Invoke(second, parameter)
        );
        return Expression.Lambda<Func<Order, bool>>(combined, parameter);
    }

    private IEnumerable<Order> ApplyOrdering(IEnumerable<Order> orders, string? sortBy, bool descending)
    {
        var orderedQuery = sortBy?.ToLower() switch
        {
            "date" => descending ? orders.OrderByDescending(o => o.CreatedAt) : orders.OrderBy(o => o.CreatedAt),
            "total" => descending ? orders.OrderByDescending(o => o.TotalAmount) : orders.OrderBy(o => o.TotalAmount),
            "status" => descending ? orders.OrderByDescending(o => o.Status) : orders.OrderBy(o => o.Status),
            "number" => descending ? orders.OrderByDescending(o => o.OrderNumber) : orders.OrderBy(o => o.OrderNumber),
            _ => descending ? orders.OrderByDescending(o => o.CreatedAt) : orders.OrderBy(o => o.CreatedAt)
        };
        return orderedQuery;
    }

    private string GetStatusDescription(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Pending => "Order has been placed and is awaiting confirmation",
            OrderStatus.Confirmed => "Order has been confirmed and will be processed soon",
            OrderStatus.Processing => "Order is being prepared for shipment",
            OrderStatus.Shipped => "Order has been shipped and is on its way",
            OrderStatus.Delivered => "Order has been delivered successfully",
            OrderStatus.Cancelled => "Order has been cancelled",
            OrderStatus.Refunded => "Order has been refunded",
            _ => "Unknown status"
        };
    }

    private DateTime? CalculateEstimatedDelivery(Order order)
    {
        if (order.Status == OrderStatus.Delivered)
        {
            return order.DeliveredAt;
        }

        if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Refunded)
        {
            return null;
        }

        // Simple estimation: 3-5 business days from ship date
        if (order.ShippedAt.HasValue)
        {
            return order.ShippedAt.Value.AddDays(5);
        }

        // If not shipped yet, estimate from order date
        return order.CreatedAt.AddDays(7);
    }
}