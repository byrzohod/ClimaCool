using System;
using ClimaCool.Domain.Enums;

namespace ClimaCool.Domain.Entities
{
    public class Refund : BaseEntity
    {
        public Guid PaymentId { get; set; }
        public Payment Payment { get; set; } = null!;
        
        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;
        
        public string RefundId { get; set; } = string.Empty; // Provider's refund ID
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        
        public RefundStatus Status { get; set; }
        public RefundReason Reason { get; set; }
        public string? Notes { get; set; }
        
        public DateTime? ProcessedAt { get; set; }
        public string? FailureReason { get; set; }
        
        public Guid? ProcessedByUserId { get; set; }
        public User? ProcessedByUser { get; set; }
    }
}