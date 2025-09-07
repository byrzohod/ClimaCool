using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Application.Services;

namespace ClimaCool.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly IAddressService _addressService;
    private readonly ILogger<AddressController> _logger;

    public AddressController(
        IAddressService addressService,
        ILogger<AddressController> logger)
    {
        _addressService = addressService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's addresses
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AddressDto>>> GetAddresses()
    {
        try
        {
            var userId = GetUserId();
            var addresses = await _addressService.GetUserAddressesAsync(userId);
            return Ok(addresses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving addresses for user {UserId}", GetUserId());
            return StatusCode(500, new { message = "An error occurred while retrieving addresses" });
        }
    }

    /// <summary>
    /// Get address by ID
    /// </summary>
    [HttpGet("{addressId}")]
    public async Task<ActionResult<AddressDto>> GetAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var address = await _addressService.GetAddressAsync(userId, addressId);
            
            if (address == null)
            {
                return NotFound(new { message = "Address not found" });
            }

            return Ok(address);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving address {AddressId}", addressId);
            return StatusCode(500, new { message = "An error occurred while retrieving the address" });
        }
    }

    /// <summary>
    /// Create new address
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] AddressDto addressDto)
    {
        try
        {
            var userId = GetUserId();
            var address = await _addressService.CreateAddressAsync(userId, addressDto);
            return CreatedAtAction(nameof(GetAddress), new { addressId = address.Id }, address);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating address for user {UserId}", GetUserId());
            return StatusCode(500, new { message = "An error occurred while creating the address" });
        }
    }

    /// <summary>
    /// Update address
    /// </summary>
    [HttpPut("{addressId}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(Guid addressId, [FromBody] AddressDto addressDto)
    {
        try
        {
            var userId = GetUserId();
            var address = await _addressService.UpdateAddressAsync(userId, addressId, addressDto);
            return Ok(address);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound(new { message = "Address not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating address {AddressId}", addressId);
            return StatusCode(500, new { message = "An error occurred while updating the address" });
        }
    }

    /// <summary>
    /// Delete address
    /// </summary>
    [HttpDelete("{addressId}")]
    public async Task<ActionResult> DeleteAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _addressService.DeleteAddressAsync(userId, addressId);
            
            if (!success)
            {
                return NotFound(new { message = "Address not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting address {AddressId}", addressId);
            return StatusCode(500, new { message = "An error occurred while deleting the address" });
        }
    }

    /// <summary>
    /// Set address as default
    /// </summary>
    [HttpPost("{addressId}/set-default")]
    public async Task<ActionResult> SetDefaultAddress(Guid addressId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _addressService.SetDefaultAddressAsync(userId, addressId);
            
            if (!success)
            {
                return NotFound(new { message = "Address not found" });
            }

            return Ok(new { message = "Address set as default successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default address {AddressId}", addressId);
            return StatusCode(500, new { message = "An error occurred while setting default address" });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }
        return Guid.Parse(userIdClaim.Value);
    }
}