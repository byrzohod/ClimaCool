using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces;

public interface IOrderStatusHistoryRepository : IRepository<OrderStatusHistory>
{
    Task<IEnumerable<OrderStatusHistory>> GetByOrderIdAsync(Guid orderId);
    Task<OrderStatusHistory?> GetLatestByOrderIdAsync(Guid orderId);
}