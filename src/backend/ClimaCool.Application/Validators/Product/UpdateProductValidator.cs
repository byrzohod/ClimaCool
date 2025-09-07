using FluentValidation;
using ClimaCool.Application.DTOs.Product;

namespace ClimaCool.Application.Validators.Product
{
    public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
    {
        public UpdateProductValidator()
        {
            // All fields are optional for update
            RuleFor(x => x.Name)
                .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Name))
                .WithMessage("Product name cannot exceed 200 characters");

            RuleFor(x => x.SKU)
                .MaximumLength(50).When(x => !string.IsNullOrEmpty(x.SKU))
                .WithMessage("SKU cannot exceed 50 characters")
                .Matches(@"^[A-Z0-9\-]+$").When(x => !string.IsNullOrEmpty(x.SKU))
                .WithMessage("SKU must contain only uppercase letters, numbers, and hyphens");

            RuleFor(x => x.Price)
                .GreaterThan(0).When(x => x.Price.HasValue)
                .WithMessage("Price must be greater than 0")
                .LessThanOrEqualTo(999999.99m).When(x => x.Price.HasValue)
                .WithMessage("Price cannot exceed 999,999.99");

            RuleFor(x => x.Cost)
                .GreaterThanOrEqualTo(0).When(x => x.Cost.HasValue)
                .WithMessage("Cost price cannot be negative")
                .LessThanOrEqualTo(999999.99m).When(x => x.Cost.HasValue)
                .WithMessage("Cost price cannot exceed 999,999.99");

            RuleFor(x => x.CompareAtPrice)
                .GreaterThan(x => x.Price ?? 0).When(x => x.CompareAtPrice.HasValue && x.Price.HasValue)
                .WithMessage("Compare at price must be greater than the regular price");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).When(x => x.CategoryId.HasValue)
                .WithMessage("Valid category must be selected");

            RuleFor(x => x.QuantityInStock)
                .GreaterThanOrEqualTo(0).When(x => x.QuantityInStock.HasValue)
                .WithMessage("Stock quantity cannot be negative");

            RuleFor(x => x.LowStockThreshold)
                .GreaterThanOrEqualTo(0).When(x => x.LowStockThreshold.HasValue)
                .WithMessage("Low stock threshold cannot be negative");

            RuleFor(x => x.Description)
                .MaximumLength(5000).When(x => !string.IsNullOrEmpty(x.Description))
                .WithMessage("Description cannot exceed 5000 characters");

            RuleFor(x => x.ShortDescription)
                .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.ShortDescription))
                .WithMessage("Short description cannot exceed 500 characters");

            RuleFor(x => x.Brand)
                .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Brand))
                .WithMessage("Brand name cannot exceed 100 characters");

            RuleFor(x => x.Weight)
                .GreaterThan(0).When(x => x.Weight.HasValue)
                .WithMessage("Weight must be greater than 0");

            RuleFor(x => x.MetaTitle)
                .MaximumLength(150).When(x => !string.IsNullOrEmpty(x.MetaTitle))
                .WithMessage("Meta title cannot exceed 150 characters");

            RuleFor(x => x.MetaDescription)
                .MaximumLength(300).When(x => !string.IsNullOrEmpty(x.MetaDescription))
                .WithMessage("Meta description cannot exceed 300 characters");

            RuleFor(x => x.MetaKeywords)
                .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.MetaKeywords))
                .WithMessage("Meta keywords cannot exceed 500 characters");
        }
    }
}