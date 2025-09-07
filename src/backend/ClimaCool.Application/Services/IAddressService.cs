using ClimaCool.Application.DTOs.Checkout;

namespace ClimaCool.Application.Services;

public interface IAddressService
{
    Task<AddressDto> CreateAddressAsync(Guid userId, AddressDto addressDto);
    Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, AddressDto addressDto);
    Task<bool> DeleteAddressAsync(Guid userId, Guid addressId);
    Task<AddressDto?> GetAddressAsync(Guid userId, Guid addressId);
    Task<IEnumerable<AddressDto>> GetUserAddressesAsync(Guid userId);
    Task<bool> SetDefaultAddressAsync(Guid userId, Guid addressId);
}