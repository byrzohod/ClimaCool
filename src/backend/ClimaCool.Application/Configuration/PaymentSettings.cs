namespace ClimaCool.Application.Configuration
{
    public class PaymentSettings
    {
        public StripeSettings Stripe { get; set; } = new();
        public PayPalSettings PayPal { get; set; } = new();
    }

    public class StripeSettings
    {
        public string PublishableKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string WebhookSecret { get; set; } = string.Empty;
        public string Currency { get; set; } = "usd";
        public bool CaptureAutomatically { get; set; } = true;
    }

    public class PayPalSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string Mode { get; set; } = "sandbox"; // sandbox or live
        public string WebhookId { get; set; } = string.Empty;
    }
}