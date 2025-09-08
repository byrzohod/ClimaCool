using System;

namespace ClimaCool.Domain.Entities
{
    public class PaymentMethod : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        
        public string StripePaymentMethodId { get; set; } = string.Empty;
        public string Type { get; set; } = "card"; // card, bank_account, paypal
        
        public string? CardBrand { get; set; } // visa, mastercard, amex, etc.
        public string? CardLast4 { get; set; }
        public int? CardExpMonth { get; set; }
        public int? CardExpYear { get; set; }
        public string? CardholderName { get; set; }
        
        public string? BillingEmail { get; set; }
        public string? BillingPhone { get; set; }
        
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; } = true;
        
        public DateTime? LastUsedAt { get; set; }
    }
}