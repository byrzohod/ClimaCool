using FluentValidation;
using ClimaCool.Application.DTOs.Product;

namespace ClimaCool.Application.Validators.Product
{
    public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
    {
        public UpdateProductValidator()
        {
            Include(new CreateProductValidator());
            
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Product ID must be valid");
        }
    }
}