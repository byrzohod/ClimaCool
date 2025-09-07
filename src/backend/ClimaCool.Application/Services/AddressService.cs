using AutoMapper;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace ClimaCool.Application.Services;

public class AddressService : IAddressService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<AddressService> _logger;

    public AddressService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<AddressService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AddressDto> CreateAddressAsync(Guid userId, AddressDto addressDto)
    {
        var address = _mapper.Map<Address>(addressDto);
        address.UserId = userId;

        // If this is set as default, unset other defaults
        if (address.IsDefault)
        {
            await UnsetOtherDefaultAddressesAsync(userId, address.Type);
        }

        await _unitOfWork.Addresses.AddAsync(address);
        await _unitOfWork.CompleteAsync();

        return _mapper.Map<AddressDto>(address);
    }

    public async Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, AddressDto addressDto)
    {
        var address = await _unitOfWork.Addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            throw new UnauthorizedAccessException("Address not found or access denied");
        }

        _mapper.Map(addressDto, address);

        // If this is set as default, unset other defaults
        if (address.IsDefault)
        {
            await UnsetOtherDefaultAddressesAsync(userId, address.Type, addressId);
        }

        await _unitOfWork.CompleteAsync();

        return _mapper.Map<AddressDto>(address);
    }

    public async Task<bool> DeleteAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _unitOfWork.Addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            return false;
        }

        await _unitOfWork.Addresses.DeleteAsync(address);
        await _unitOfWork.CompleteAsync();

        return true;
    }

    public async Task<AddressDto?> GetAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _unitOfWork.Addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            return null;
        }

        return _mapper.Map<AddressDto>(address);
    }

    public async Task<IEnumerable<AddressDto>> GetUserAddressesAsync(Guid userId)
    {
        var addresses = await _unitOfWork.Addresses.GetUserAddressesAsync(userId);
        return _mapper.Map<IEnumerable<AddressDto>>(addresses);
    }

    public async Task<bool> SetDefaultAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _unitOfWork.Addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            return false;
        }

        // Unset other defaults of the same type
        await UnsetOtherDefaultAddressesAsync(userId, address.Type, addressId);

        address.IsDefault = true;
        await _unitOfWork.CompleteAsync();

        return true;
    }

    private async Task UnsetOtherDefaultAddressesAsync(Guid userId, Domain.Enums.AddressType type, Guid? excludeAddressId = null)
    {
        var addresses = await _unitOfWork.Addresses.GetUserAddressesAsync(userId);
        var defaultAddresses = addresses
            .Where(a => a.Type == type && a.IsDefault && a.Id != excludeAddressId);

        foreach (var address in defaultAddresses)
        {
            address.IsDefault = false;
        }
    }
}