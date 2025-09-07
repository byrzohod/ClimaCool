using ClimaCool.Domain.Enums;

namespace ClimaCool.Application.DTOs.Checkout;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public AddressDto ShippingAddress { get; set; } = new();
    public AddressDto BillingAddress { get; set; } = new();
    public List<OrderItemDto> Items { get; set; } = new();
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSku { get; set; }
    public string? VariantName { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Total { get; set; }
    public string? ProductDescription { get; set; }
    public string? ProductImageUrl { get; set; }
}