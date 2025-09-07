using Microsoft.EntityFrameworkCore.Storage;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Domain.Entities;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IUserRepository? _userRepository;
    private IRepository<Role>? _roleRepository;
    private IRepository<RefreshToken>? _refreshTokenRepository;
    private ICartRepository? _cartRepository;
    private IOrderRepository? _orderRepository;
    private IAddressRepository? _addressRepository;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _userRepository ??= new UserRepository(_context);
    public IRepository<Role> Roles => _roleRepository ??= new Repository<Role>(_context);
    public IRepository<RefreshToken> RefreshTokens => _refreshTokenRepository ??= new Repository<RefreshToken>(_context);
    public ICartRepository Carts => _cartRepository ??= new CartRepository(_context);
    public IOrderRepository Orders => _orderRepository ??= new OrderRepository(_context);
    public IAddressRepository Addresses => _addressRepository ??= new AddressRepository(_context);

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}