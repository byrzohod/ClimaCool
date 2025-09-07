using ClimaCool.Application.DTOs.Checkout;

namespace ClimaCool.Application.Services;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderRequest request);
    Task<OrderDto> GetOrderAsync(Guid userId, Guid orderId);
    Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId, int page = 1, int pageSize = 10);
    Task<bool> CancelOrderAsync(Guid userId, Guid orderId);
}