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
    public class RefundRepository : Repository<Refund>, IRefundRepository
    {
        public RefundRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Refund?> GetByRefundIdAsync(string refundId)
        {
            return await _dbSet
                .Include(r => r.Payment)
                .Include(r => r.Order)
                .FirstOrDefaultAsync(r => r.RefundId == refundId);
        }

        public async Task<IEnumerable<Refund>> GetByOrderIdAsync(Guid orderId)
        {
            return await _dbSet
                .Where(r => r.OrderId == orderId)
                .Include(r => r.Payment)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Refund>> GetByPaymentIdAsync(Guid paymentId)
        {
            return await _dbSet
                .Where(r => r.PaymentId == paymentId)
                .Include(r => r.Order)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Refund>> GetByStatusAsync(RefundStatus status)
        {
            return await _dbSet
                .Where(r => r.Status == status)
                .Include(r => r.Payment)
                .Include(r => r.Order)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Refund>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate)
                .Include(r => r.Payment)
                .Include(r => r.Order)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalRefundedAmountAsync(Guid orderId)
        {
            return await _dbSet
                .Where(r => r.OrderId == orderId && r.Status == RefundStatus.Succeeded)
                .SumAsync(r => r.Amount);
        }

        public async Task<decimal> GetTotalRefundedAmountForPaymentAsync(Guid paymentId)
        {
            return await _dbSet
                .Where(r => r.PaymentId == paymentId && r.Status == RefundStatus.Succeeded)
                .SumAsync(r => r.Amount);
        }

        public async Task<Refund?> GetWithPaymentAndOrderAsync(Guid refundId)
        {
            return await _dbSet
                .Include(r => r.Payment)
                .Include(r => r.Order)
                    .ThenInclude(o => o.User)
                .Include(r => r.ProcessedByUser)
                .FirstOrDefaultAsync(r => r.Id == refundId);
        }
    }
}