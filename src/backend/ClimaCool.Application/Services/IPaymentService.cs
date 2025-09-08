using System;
using System.Threading.Tasks;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Services
{
    public interface IPaymentService
    {
        // Payment Intent Management
        Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(CreatePaymentIntentDto dto, Guid userId);
        Task<PaymentIntentResponseDto> ConfirmPaymentAsync(ConfirmPaymentDto dto, Guid userId);
        Task<PaymentDto> GetPaymentAsync(Guid paymentId);
        Task<IEnumerable<PaymentDto>> GetOrderPaymentsAsync(Guid orderId);
        Task<PaymentDto> UpdatePaymentStatusAsync(string paymentIntentId, string status);
        
        // Payment Method Management
        Task<PaymentMethodDto> AddPaymentMethodAsync(CreatePaymentMethodDto dto, Guid userId);
        Task<IEnumerable<PaymentMethodDto>> GetUserPaymentMethodsAsync(Guid userId);
        Task<PaymentMethodDto> GetPaymentMethodAsync(Guid paymentMethodId);
        Task<bool> DeletePaymentMethodAsync(Guid paymentMethodId, Guid userId);
        Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(Guid paymentMethodId, Guid userId);
        
        // Refund Management
        Task<RefundDto> CreateRefundAsync(CreateRefundDto dto, Guid processedByUserId);
        Task<RefundDto> GetRefundAsync(Guid refundId);
        Task<IEnumerable<RefundDto>> GetOrderRefundsAsync(Guid orderId);
        Task<RefundDto> UpdateRefundStatusAsync(string refundId, string status);
        
        // Webhook Processing
        Task ProcessStripeWebhookAsync(string payload, string signature);
        Task ProcessPayPalWebhookAsync(string payload, string signature);
        
        // Analytics
        Task<PaymentSummaryDto> GetPaymentSummaryAsync(DateTime startDate, DateTime endDate);
    }
}