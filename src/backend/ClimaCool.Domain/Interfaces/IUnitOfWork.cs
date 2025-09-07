using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IRepository<Role> Roles { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    ICartRepository Carts { get; }
    IOrderRepository Orders { get; }
    IAddressRepository Addresses { get; }
    
    Task<int> CompleteAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}