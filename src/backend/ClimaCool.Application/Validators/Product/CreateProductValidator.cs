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

            RuleFor(x => x.CostPrice)
                .GreaterThanOrEqualTo(0).WithMessage("Cost price cannot be negative")
                .LessThanOrEqualTo(999999.99m).WithMessage("Cost price cannot exceed 999,999.99");

            RuleFor(x => x.CompareAtPrice)
                .GreaterThan(x => x.Price).When(x => x.CompareAtPrice.HasValue)
                .WithMessage("Compare at price must be greater than the regular price");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Valid category must be selected");

            RuleFor(x => x.ProductType)
                .IsInEnum().WithMessage("Invalid product type");

            RuleFor(x => x.StockQuantity)
                .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative");

            RuleFor(x => x.LowStockThreshold)
                .GreaterThanOrEqualTo(0).When(x => x.LowStockThreshold.HasValue)
                .WithMessage("Low stock threshold cannot be negative");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("Description cannot exceed 5000 characters");

            RuleFor(x => x.ShortDescription)
                .MaximumLength(500).WithMessage("Short description cannot exceed 500 characters");

            RuleFor(x => x.Brand)
                .MaximumLength(100).WithMessage("Brand name cannot exceed 100 characters");

            RuleFor(x => x.Model)
                .MaximumLength(100).WithMessage("Model cannot exceed 100 characters");

            RuleFor(x => x.Barcode)
                .MaximumLength(50).WithMessage("Barcode cannot exceed 50 characters")
                .Matches(@"^\d+$").When(x => !string.IsNullOrEmpty(x.Barcode))
                .WithMessage("Barcode must contain only digits");

            RuleFor(x => x.Weight)
                .GreaterThan(0).When(x => x.Weight.HasValue)
                .WithMessage("Weight must be greater than 0");

            RuleFor(x => x.Length)
                .GreaterThan(0).When(x => x.Length.HasValue)
                .WithMessage("Length must be greater than 0");

            RuleFor(x => x.Width)
                .GreaterThan(0).When(x => x.Width.HasValue)
                .WithMessage("Width must be greater than 0");

            RuleFor(x => x.Height)
                .GreaterThan(0).When(x => x.Height.HasValue)
                .WithMessage("Height must be greater than 0");

            RuleFor(x => x.MetaTitle)
                .MaximumLength(150).WithMessage("Meta title cannot exceed 150 characters");

            RuleFor(x => x.MetaDescription)
                .MaximumLength(300).WithMessage("Meta description cannot exceed 300 characters");

            RuleFor(x => x.MetaKeywords)
                .MaximumLength(500).WithMessage("Meta keywords cannot exceed 500 characters");
        }
    }
}