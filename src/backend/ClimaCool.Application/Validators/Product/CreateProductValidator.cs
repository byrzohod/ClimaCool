using FluentValidation;
using ClimaCool.Application.DTOs.Product;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Validators.Product
{
    public class CreateProductValidator : AbstractValidator<CreateProductDto>
    {
        public CreateProductValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Product name is required")
                .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

            RuleFor(x => x.SKU)
                .NotEmpty().WithMessage("SKU is required")
                .MaximumLength(50).WithMessage("SKU cannot exceed 50 characters")
                .Matches(@"^[A-Z0-9\-]+$").WithMessage("SKU must contain only uppercase letters, numbers, and hyphens");

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Price must be greater than 0")
                .LessThanOrEqualTo(999999.99m).WithMessage("Price cannot exceed 999,999.99");

            RuleFor(x => x.Cost)
                .GreaterThanOrEqualTo(0).When(x => x.Cost.HasValue)
                .WithMessage("Cost price cannot be negative")
                .LessThanOrEqualTo(999999.99m).When(x => x.Cost.HasValue)
                .WithMessage("Cost price cannot exceed 999,999.99");

            RuleFor(x => x.CompareAtPrice)
                .GreaterThan(x => x.Price).When(x => x.CompareAtPrice.HasValue)
                .WithMessage("Compare at price must be greater than the regular price");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Valid category must be selected");

            // ProductType removed - not in DTO

            RuleFor(x => x.QuantityInStock)
                .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative");

            RuleFor(x => x.LowStockThreshold)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Low stock threshold cannot be negative");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters");

            RuleFor(x => x.ShortDescription)
                .MaximumLength(500).WithMessage("Short description cannot exceed 500 characters");

            RuleFor(x => x.Brand)
                .MaximumLength(100).WithMessage("Brand name cannot exceed 100 characters");

            // Model removed - not in DTO

            // Barcode removed - not in DTO

            RuleFor(x => x.Weight)
                .GreaterThan(0).When(x => x.Weight.HasValue)
                .WithMessage("Weight must be greater than 0");

            // Length removed - not in DTO

            // Width removed - not in DTO

            // Height removed - not in DTO

            RuleFor(x => x.MetaTitle)
                .MaximumLength(150).WithMessage("Meta title cannot exceed 150 characters");

            RuleFor(x => x.MetaDescription)
                .MaximumLength(300).WithMessage("Meta description cannot exceed 300 characters");

            RuleFor(x => x.MetaKeywords)
                .MaximumLength(500).WithMessage("Meta keywords cannot exceed 500 characters");
        }
    }
}