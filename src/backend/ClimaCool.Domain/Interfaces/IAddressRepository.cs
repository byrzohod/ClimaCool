using ClimaCool.Domain.Entities;

namespace ClimaCool.Domain.Interfaces;

public interface IAddressRepository : IRepository<Address>
{
    Task<IEnumerable<Address>> GetUserAddressesAsync(Guid userId);
}