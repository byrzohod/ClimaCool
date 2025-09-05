using System;
using System.Linq;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClimaCool.Infrastructure.Repositories
{
    public class CartRepository : Repository<Cart>, ICartRepository
    {
        public CartRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Cart?> GetBySessionIdAsync(string sessionId)
        {
            return await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Images)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                .FirstOrDefaultAsync(c => c.SessionId == sessionId && c.ExpiresAt > DateTime.UtcNow);
        }

        public async Task<Cart?> GetByUserIdAsync(Guid userId)
        {
            return await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Images)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ExpiresAt > DateTime.UtcNow);
        }

        public async Task<Cart?> GetWithItemsAsync(int cartId)
        {
            return await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Images)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                .FirstOrDefaultAsync(c => c.Id == cartId);
        }

        public async Task<Cart?> GetActiveCartAsync(Guid? userId, string sessionId)
        {
            var query = _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Images)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                .Where(c => c.ExpiresAt > DateTime.UtcNow);

            // If user is authenticated, prioritize user cart
            if (userId.HasValue)
            {
                var userCart = await query.FirstOrDefaultAsync(c => c.UserId == userId);
                if (userCart != null)
                    return userCart;
            }

            // Fall back to session cart
            return await query.FirstOrDefaultAsync(c => c.SessionId == sessionId);
        }

        public async Task RemoveExpiredCartsAsync()
        {
            var expiredCarts = await _context.Carts
                .Where(c => c.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync();

            _context.Carts.RemoveRange(expiredCarts);
        }

        public async Task<bool> MergeCartsAsync(Guid userId, string sessionId)
        {
            var sessionCart = await GetBySessionIdAsync(sessionId);
            if (sessionCart == null || !sessionCart.Items.Any())
                return false;

            var userCart = await GetByUserIdAsync(userId);
            
            if (userCart == null)
            {
                // Convert session cart to user cart
                sessionCart.UserId = userId;
                sessionCart.ExpiresAt = DateTime.UtcNow.AddDays(30); // Extend expiration for logged-in users
                _context.Carts.Update(sessionCart);
            }
            else
            {
                // Merge items from session cart to user cart
                foreach (var item in sessionCart.Items)
                {
                    var existingItem = userCart.Items.FirstOrDefault(i => i.ProductId == item.ProductId);
                    if (existingItem != null)
                    {
                        existingItem.Quantity += item.Quantity;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        item.CartId = userCart.Id;
                        userCart.Items.Add(item);
                    }
                }

                userCart.LastAccessedAt = DateTime.UtcNow;
                _context.Carts.Update(userCart);
                
                // Remove the session cart
                _context.Carts.Remove(sessionCart);
            }

            return true;
        }
    }
}