using ClimaCool.Application.DTOs.Order;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ClimaCool.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderManagementController : ControllerBase
{
    private readonly IOrderManagementService _orderManagementService;
    private readonly ILogger<OrderManagementController> _logger;

    public OrderManagementController(
        IOrderManagementService orderManagementService,
        ILogger<OrderManagementController> logger)
    {
        _orderManagementService = orderManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's orders with filtering and pagination
    /// </summary>
    [HttpGet("my-orders")]
    public async Task<ActionResult<PagedResult<OrderDto>>> GetMyOrders([FromQuery] OrderFilterRequest filter)
    {
        var userId = GetUserId();
        var result = await _orderManagementService.GetUserOrdersAsync(userId, filter);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific order by ID
    /// </summary>
    [HttpGet("{orderId}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid orderId)
    {
        var userId = GetUserId();
        var order = await _orderManagementService.GetOrderByIdAsync(orderId, userId);
        return Ok(order);
    }

    /// <summary>
    /// Get order tracking information
    /// </summary>
    [HttpGet("{orderId}/tracking")]
    public async Task<ActionResult<TrackingInfo>> GetTrackingInfo(Guid orderId)
    {
        var trackingInfo = await _orderManagementService.GetTrackingInfoAsync(orderId);
        return Ok(trackingInfo);
    }

    /// <summary>
    /// Get order status history
    /// </summary>
    [HttpGet("{orderId}/history")]
    public async Task<ActionResult<List<OrderStatusHistoryDto>>> GetOrderHistory(Guid orderId)
    {
        var history = await _orderManagementService.GetOrderStatusHistoryAsync(orderId);
        return Ok(history);
    }

    /// <summary>
    /// Cancel an order
    /// </summary>
    [HttpPost("{orderId}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelOrder(Guid orderId, [FromBody] CancelOrderRequest request)
    {
        var userId = GetUserId();
        var order = await _orderManagementService.CancelOrderAsync(orderId, userId, request.Reason);
        return Ok(order);
    }

    /// <summary>
    /// Check if an order can be cancelled
    /// </summary>
    [HttpGet("{orderId}/can-cancel")]
    public async Task<ActionResult<bool>> CanCancelOrder(Guid orderId)
    {
        var userId = GetUserId();
        var canCancel = await _orderManagementService.CanCancelOrderAsync(orderId, userId);
        return Ok(canCancel);
    }

    /// <summary>
    /// Reorder - add all items from a previous order to cart
    /// </summary>
    [HttpPost("{orderId}/reorder")]
    public async Task<ActionResult<OrderDto>> Reorder(Guid orderId)
    {
        var userId = GetUserId();
        var order = await _orderManagementService.ReorderAsync(orderId, userId);
        return Ok(new { message = "Items added to cart", order });
    }

    /// <summary>
    /// Get order statistics for the current user
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<OrderStatisticsDto>> GetStatistics()
    {
        var userId = GetUserId();
        var stats = await _orderManagementService.GetOrderStatisticsAsync(userId);
        return Ok(stats);
    }

    /// <summary>
    /// Admin: Get all orders with filtering
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<OrderDto>>> GetAllOrders([FromQuery] OrderFilterRequest filter)
    {
        var result = await _orderManagementService.GetOrdersAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Admin: Update order status
    /// </summary>
    [HttpPut("admin/{orderId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(
        Guid orderId, 
        [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderManagementService.UpdateOrderStatusAsync(
            orderId, 
            request.NewStatus, 
            request.Notes);
        return Ok(order);
    }

    /// <summary>
    /// Admin: Get overall statistics
    /// </summary>
    [HttpGet("admin/statistics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrderStatisticsDto>> GetOverallStatistics()
    {
        var stats = await _orderManagementService.GetOrderStatisticsAsync();
        return Ok(stats);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}

public class CancelOrderRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class UpdateOrderStatusRequest
{
    public OrderStatus NewStatus { get; set; }
    public string? Notes { get; set; }
}