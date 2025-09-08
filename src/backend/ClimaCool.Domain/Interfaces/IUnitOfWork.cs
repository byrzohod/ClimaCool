using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Repositories;

namespace ClimaCool.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IRepository<Role> Roles { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    ICartRepository Carts { get; }
    IOrderRepository Orders { get; }
    IAddressRepository Addresses { get; }
    IPaymentRepository Payments { get; }
    IPaymentMethodRepository PaymentMethods { get; }
    IRefundRepository Refunds { get; }
    
    Task<int> CompleteAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}