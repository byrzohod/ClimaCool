using System;
using ClimaCool.Domain.Enums;

namespace ClimaCool.Domain.Entities
{
    public class Payment : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;
        
        public string PaymentIntentId { get; set; } = string.Empty;
        public PaymentProvider Provider { get; set; }
        public PaymentMethodEnum Method { get; set; }
        public PaymentStatus Status { get; set; }
        
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        
        public string? CardLast4 { get; set; }
        public string? CardBrand { get; set; }
        
        public string? TransactionId { get; set; }
        public string? ReferenceNumber { get; set; }
        
        public DateTime? ProcessedAt { get; set; }
        public string? FailureReason { get; set; }
        
        public string? Metadata { get; set; } // JSON for additional provider-specific data
    }
}