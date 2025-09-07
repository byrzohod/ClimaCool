namespace ClimaCool.Application.DTOs.Checkout;

public class CreateOrderRequest
{
    public AddressDto ShippingAddress { get; set; } = new();
    public AddressDto BillingAddress { get; set; } = new();
    public string? Notes { get; set; }
}