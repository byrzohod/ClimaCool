using System;

namespace ClimaCool.Domain.Entities
{
    public class ProductReview : CatalogBaseEntity
    {
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string? Comment { get; set; }
        public bool IsVerifiedPurchase { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int HelpfulVotes { get; set; }
        public int TotalVotes { get; set; }
    }
}