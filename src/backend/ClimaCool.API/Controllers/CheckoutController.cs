using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Application.Services;

namespace ClimaCool.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CheckoutController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<CheckoutController> _logger;

    public CheckoutController(
        IOrderService orderService,
        ILogger<CheckoutController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new order from the current cart
    /// </summary>
    [HttpPost("create-order")]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var userId = GetUserId();
            var order = await _orderService.CreateOrderAsync(userId, request);
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, new { message = "An error occurred while creating the order" });
        }
    }

    /// <summary>
    /// Get order by ID
    /// </summary>
    [HttpGet("orders/{orderId}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid orderId)
    {
        try
        {
            var userId = GetUserId();
            var order = await _orderService.GetOrderAsync(userId, orderId);
            return Ok(order);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound(new { message = "Order not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred while retrieving the order" });
        }
    }

    /// <summary>
    /// Get user's orders with pagination
    /// </summary>
    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetUserOrders(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var userId = GetUserId();
            var orders = await _orderService.GetUserOrdersAsync(userId, page, pageSize);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for user {UserId}", GetUserId());
            return StatusCode(500, new { message = "An error occurred while retrieving orders" });
        }
    }

    /// <summary>
    /// Cancel an order
    /// </summary>
    [HttpPost("orders/{orderId}/cancel")]
    public async Task<ActionResult> CancelOrder(Guid orderId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _orderService.CancelOrderAsync(userId, orderId);
            
            if (!success)
            {
                return NotFound(new { message = "Order not found" });
            }

            return Ok(new { message = "Order cancelled successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order {OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred while cancelling the order" });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }
        return Guid.Parse(userIdClaim.Value);
    }
}