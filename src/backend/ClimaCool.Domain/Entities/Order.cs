using ClimaCool.Domain.Enums;

namespace ClimaCool.Domain.Entities;

public class Order : BaseEntity
{
    public Guid UserId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    
    // Address details stored as JSON or separate address entities
    public Guid ShippingAddressId { get; set; }
    public Guid BillingAddressId { get; set; }
    
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? Notes { get; set; }
    
    // Tracking information
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Address ShippingAddress { get; set; } = null!;
    public virtual Address BillingAddress { get; set; } = null!;
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}