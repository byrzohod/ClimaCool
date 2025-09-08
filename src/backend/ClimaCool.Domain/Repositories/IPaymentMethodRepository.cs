using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Repositories
{
    public interface IPaymentMethodRepository : IRepository<PaymentMethod>
    {
        Task<IEnumerable<PaymentMethod>> GetByUserIdAsync(Guid userId);
        Task<PaymentMethod?> GetByStripePaymentMethodIdAsync(string stripePaymentMethodId);
        Task<PaymentMethod?> GetDefaultForUserAsync(Guid userId);
        Task<IEnumerable<PaymentMethod>> GetActiveByUserIdAsync(Guid userId);
        Task<bool> SetDefaultAsync(Guid paymentMethodId, Guid userId);
        Task<bool> DeactivateAsync(Guid paymentMethodId, Guid userId);
        Task<bool> HasPaymentMethodAsync(Guid userId);
        Task<PaymentMethod?> GetWithUserAsync(Guid paymentMethodId);
    }
}