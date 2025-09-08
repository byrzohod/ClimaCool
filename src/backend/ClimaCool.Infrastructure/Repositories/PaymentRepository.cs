using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Repositories;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Infrastructure.Repositories
{
    public class PaymentRepository : Repository<Payment>, IPaymentRepository
    {
        public PaymentRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Payment?> GetByPaymentIntentIdAsync(string paymentIntentId)
        {
            return await _dbSet
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentIntentId == paymentIntentId);
        }

        public async Task<IEnumerable<Payment>> GetByOrderIdAsync(Guid orderId)
        {
            return await _dbSet
                .Where(p => p.OrderId == orderId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByUserIdAsync(Guid userId)
        {
            return await _dbSet
                .Include(p => p.Order)
                .Where(p => p.Order.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByStatusAsync(PaymentStatus status)
        {
            return await _dbSet
                .Where(p => p.Status == status)
                .Include(p => p.Order)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                .Include(p => p.Order)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalAmountByDateRangeAsync(DateTime startDate, DateTime endDate, PaymentStatus? status = null)
        {
            var query = _dbSet
                .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate);

            if (status.HasValue)
            {
                query = query.Where(p => p.Status == status.Value);
            }

            return await query.SumAsync(p => p.Amount);
        }

        public async Task<bool> HasSuccessfulPaymentAsync(Guid orderId)
        {
            return await _dbSet
                .AnyAsync(p => p.OrderId == orderId && p.Status == PaymentStatus.Succeeded);
        }

        public async Task<Payment?> GetWithOrderAsync(Guid paymentId)
        {
            return await _dbSet
                .Include(p => p.Order)
                    .ThenInclude(o => o.Items)
                .Include(p => p.Order)
                    .ThenInclude(o => o.User)
                .FirstOrDefaultAsync(p => p.Id == paymentId);
        }
    }
}