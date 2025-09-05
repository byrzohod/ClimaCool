using System;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces
{
    public interface ICartRepository : IRepository<Cart>
    {
        Task<Cart?> GetBySessionIdAsync(string sessionId);
        Task<Cart?> GetByUserIdAsync(Guid userId);
        Task<Cart?> GetWithItemsAsync(int cartId);
        Task<Cart?> GetActiveCartAsync(Guid? userId, string sessionId);
        Task RemoveExpiredCartsAsync();
        Task<bool> MergeCartsAsync(Guid userId, string sessionId);
    }
}