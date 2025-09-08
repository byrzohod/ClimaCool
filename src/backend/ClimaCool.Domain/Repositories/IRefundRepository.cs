using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Domain.Repositories
{
    public interface IRefundRepository : IRepository<Refund>
    {
        Task<Refund?> GetByRefundIdAsync(string refundId);
        Task<IEnumerable<Refund>> GetByOrderIdAsync(Guid orderId);
        Task<IEnumerable<Refund>> GetByPaymentIdAsync(Guid paymentId);
        Task<IEnumerable<Refund>> GetByStatusAsync(RefundStatus status);
        Task<IEnumerable<Refund>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalRefundedAmountAsync(Guid orderId);
        Task<decimal> GetTotalRefundedAmountForPaymentAsync(Guid paymentId);
        Task<Refund?> GetWithPaymentAndOrderAsync(Guid refundId);
    }
}