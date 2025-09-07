using ClimaCool.Domain.Enums;

namespace ClimaCool.Application.DTOs.Order;

public class OrderStatusHistoryDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Notes { get; set; }
    public string? ChangedBy { get; set; }
}

public class OrderStatisticsDto
{
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int ShippedOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int RefundedOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class TrackingInfo
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus CurrentStatus { get; set; }
    public List<TrackingEvent> StatusHistory { get; set; } = new();
    public DateTime? EstimatedDelivery { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
}

public class TrackingEvent
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class AddToCartRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public int? VariantId { get; set; }
}