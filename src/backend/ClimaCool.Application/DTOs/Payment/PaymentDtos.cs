using System;
using ClimaCool.Domain.Enums;

namespace ClimaCool.Application.DTOs.Payment
{
    public class CreatePaymentIntentDto
    {
        public Guid OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string? PaymentMethodId { get; set; }
        public bool SavePaymentMethod { get; set; }
        public Dictionary<string, string>? Metadata { get; set; }
    }

    public class PaymentIntentResponseDto
    {
        public string PaymentIntentId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public bool RequiresAction { get; set; }
        public string? NextAction { get; set; }
    }

    public class ConfirmPaymentDto
    {
        public string PaymentIntentId { get; set; } = string.Empty;
        public string? PaymentMethodId { get; set; }
        public bool SavePaymentMethod { get; set; }
    }

    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string PaymentIntentId { get; set; } = string.Empty;
        public PaymentProvider Provider { get; set; }
        public PaymentMethodEnum Method { get; set; }
        public PaymentStatus Status { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string? CardLast4 { get; set; }
        public string? CardBrand { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? FailureReason { get; set; }
    }

    public class PaymentMethodDto
    {
        public Guid Id { get; set; }
        public string StripePaymentMethodId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? CardBrand { get; set; }
        public string? CardLast4 { get; set; }
        public int? CardExpMonth { get; set; }
        public int? CardExpYear { get; set; }
        public string? CardholderName { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }

    public class CreatePaymentMethodDto
    {
        public string? StripePaymentMethodId { get; set; }
        public string? CardNumber { get; set; }
        public int? CardExpMonth { get; set; }
        public int? CardExpYear { get; set; }
        public string? CardCvc { get; set; }
        public string? CardholderName { get; set; }
        public bool SetAsDefault { get; set; }
    }

    public class RefundDto
    {
        public Guid Id { get; set; }
        public Guid PaymentId { get; set; }
        public Guid OrderId { get; set; }
        public string RefundId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public RefundStatus Status { get; set; }
        public RefundReason Reason { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? FailureReason { get; set; }
    }

    public class CreateRefundDto
    {
        public Guid PaymentId { get; set; }
        public decimal Amount { get; set; }
        public RefundReason Reason { get; set; }
        public string? Notes { get; set; }
    }

    public class PaymentSummaryDto
    {
        public decimal TotalPayments { get; set; }
        public decimal TotalRefunds { get; set; }
        public decimal NetAmount { get; set; }
        public int SuccessfulPayments { get; set; }
        public int FailedPayments { get; set; }
        public int PendingPayments { get; set; }
    }
}