using System.Threading.Tasks;
using ClimaCool.Application.DTOs.Cart;

namespace ClimaCool.Application.Services
{
    public interface ICartService
    {
        Task<CartDto?> GetCartAsync(Guid? userId, string sessionId);
        Task<CartDto> AddToCartAsync(Guid? userId, string sessionId, AddToCartDto dto);
        Task<CartDto> UpdateCartItemAsync(Guid? userId, string sessionId, int productId, UpdateCartItemDto dto);
        Task<CartDto> RemoveFromCartAsync(Guid? userId, string sessionId, int productId);
        Task<CartDto> ClearCartAsync(Guid? userId, string sessionId);
        Task<CartSummaryDto> GetCartSummaryAsync(Guid? userId, string sessionId);
        Task<bool> MergeCartsAsync(Guid userId, string sessionId);
        Task CleanupExpiredCartsAsync();
    }
}