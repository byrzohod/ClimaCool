using ClimaCool.Domain.Enums;

namespace ClimaCool.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Notes { get; set; }
    public string? ChangedBy { get; set; }
    
    // Navigation property
    public virtual Order Order { get; set; } = null!;
}