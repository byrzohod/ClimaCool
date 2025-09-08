using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Domain.Repositories
{
    public interface IPaymentRepository : IRepository<Payment>
    {
        Task<Payment?> GetByPaymentIntentIdAsync(string paymentIntentId);
        Task<IEnumerable<Payment>> GetByOrderIdAsync(Guid orderId);
        Task<IEnumerable<Payment>> GetByUserIdAsync(Guid userId);
        Task<IEnumerable<Payment>> GetByStatusAsync(PaymentStatus status);
        Task<IEnumerable<Payment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalAmountByDateRangeAsync(DateTime startDate, DateTime endDate, PaymentStatus? status = null);
        Task<bool> HasSuccessfulPaymentAsync(Guid orderId);
        Task<Payment?> GetWithOrderAsync(Guid paymentId);
    }
}