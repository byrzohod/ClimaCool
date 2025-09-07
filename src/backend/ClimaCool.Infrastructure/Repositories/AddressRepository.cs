using Microsoft.EntityFrameworkCore;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Infrastructure.Repositories;

public class AddressRepository : Repository<Address>, IAddressRepository
{
    public AddressRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Address>> GetUserAddressesAsync(Guid userId)
    {
        return await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Type)
            .ThenByDescending(a => a.IsDefault)
            .ThenBy(a => a.CreatedAt)
            .ToListAsync();
    }
}