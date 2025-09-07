using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces;

public interface IOrderRepository : IRepository<Order>
{
    Task<IEnumerable<Order>> GetUserOrdersAsync(Guid userId, int page = 1, int pageSize = 10);
    Task<Order?> GetByOrderNumberAsync(string orderNumber);
}