using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Repositories;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Infrastructure.Repositories
{
    public class PaymentMethodRepository : Repository<PaymentMethod>, IPaymentMethodRepository
    {
        public PaymentMethodRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<PaymentMethod>> GetByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Where(pm => pm.UserId == userId)
                .OrderByDescending(pm => pm.IsDefault)
                .ThenByDescending(pm => pm.CreatedAt)
                .ToListAsync();
        }

        public async Task<PaymentMethod?> GetByStripePaymentMethodIdAsync(string stripePaymentMethodId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(pm => pm.StripePaymentMethodId == stripePaymentMethodId);
        }

        public async Task<PaymentMethod?> GetDefaultForUserAsync(Guid userId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(pm => pm.UserId == userId && pm.IsDefault && pm.IsActive);
        }

        public async Task<IEnumerable<PaymentMethod>> GetActiveByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Where(pm => pm.UserId == userId && pm.IsActive)
                .OrderByDescending(pm => pm.IsDefault)
                .ThenByDescending(pm => pm.LastUsedAt ?? pm.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> SetDefaultAsync(Guid paymentMethodId, Guid userId)
        {
            // First, unset all other defaults for this user
            var userPaymentMethods = await _dbSet
                .Where(pm => pm.UserId == userId && pm.IsDefault)
                .ToListAsync();

            foreach (var pm in userPaymentMethods)
            {
                pm.IsDefault = false;
            }

            // Now set the new default
            var paymentMethod = await _dbSet
                .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId);

            if (paymentMethod != null)
            {
                paymentMethod.IsDefault = true;
                return true;
            }

            return false;
        }

        public async Task<bool> DeactivateAsync(Guid paymentMethodId, Guid userId)
        {
            var paymentMethod = await _dbSet
                .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId && pm.UserId == userId);

            if (paymentMethod != null)
            {
                paymentMethod.IsActive = false;
                paymentMethod.IsDefault = false;
                return true;
            }

            return false;
        }

        public async Task<bool> HasPaymentMethodAsync(Guid userId)
        {
            return await _dbSet
                .AnyAsync(pm => pm.UserId == userId && pm.IsActive);
        }

        public async Task<PaymentMethod?> GetWithUserAsync(Guid paymentMethodId)
        {
            return await _dbSet
                .Include(pm => pm.User)
                .FirstOrDefaultAsync(pm => pm.Id == paymentMethodId);
        }
    }
}