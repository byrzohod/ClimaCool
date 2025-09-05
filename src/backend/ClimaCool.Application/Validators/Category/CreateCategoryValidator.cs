using FluentValidation;
using ClimaCool.Application.DTOs.Category;

namespace ClimaCool.Application.Validators.Category
{
    public class CreateCategoryValidator : AbstractValidator<CreateCategoryDto>
    {
        public CreateCategoryValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Category name is required")
                .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

            RuleFor(x => x.ParentCategoryId)
                .GreaterThan(0).When(x => x.ParentCategoryId.HasValue)
                .WithMessage("Parent category ID must be valid");

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative");

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters")
                .Must(BeAValidUrl).When(x => !string.IsNullOrEmpty(x.ImageUrl))
                .WithMessage("Image URL must be a valid URL");

            RuleFor(x => x.MetaTitle)
                .MaximumLength(150).WithMessage("Meta title cannot exceed 150 characters");

            RuleFor(x => x.MetaDescription)
                .MaximumLength(300).WithMessage("Meta description cannot exceed 300 characters");

            RuleFor(x => x.MetaKeywords)
                .MaximumLength(500).WithMessage("Meta keywords cannot exceed 500 characters");
        }

        private bool BeAValidUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return true;

            return Uri.TryCreate(url, UriKind.Absolute, out var result) 
                && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
        }
    }
}