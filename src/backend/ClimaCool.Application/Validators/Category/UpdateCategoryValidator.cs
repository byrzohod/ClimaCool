using FluentValidation;
using ClimaCool.Application.DTOs.Category;

namespace ClimaCool.Application.Validators.Category
{
    public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryValidator()
        {
            Include(new CreateCategoryValidator());
            
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Category ID must be valid");
        }
    }
}