namespace ClimaCool.Domain.Enums
{
    public enum PaymentProvider
    {
        Stripe = 1,
        PayPal = 2,
        Manual = 3
    }

    public enum PaymentMethodEnum
    {
        Card = 1,
        BankTransfer = 2,
        PayPal = 3,
        ApplePay = 4,
        GooglePay = 5,
        Cash = 6
    }

    public enum PaymentStatus
    {
        Pending = 1,
        Processing = 2,
        Succeeded = 3,
        Failed = 4,
        Cancelled = 5,
        Refunded = 6,
        PartiallyRefunded = 7,
        RequiresAction = 8,
        RequiresCapture = 9
    }

    public enum RefundStatus
    {
        Pending = 1,
        Processing = 2,
        Succeeded = 3,
        Failed = 4,
        Cancelled = 5
    }

    public enum PaymentMethodType
    {
        CreditCard = 1,
        DebitCard = 2,
        BankAccount = 3,
        PayPal = 4,
        ApplePay = 5,
        GooglePay = 6,
        DigitalWallet = 7
    }

    public enum RefundReason
    {
        RequestedByCustomer = 1,
        Duplicate = 2,
        Fraudulent = 3,
        ProductDefective = 4,
        ProductNotReceived = 5,
        Other = 6
    }
}