using FluentValidation;
using PropertyService.Application.DTOs;

namespace PropertyService.Application.Validators
{
    public class CreatePropertyRequestValidator : AbstractValidator<CreatePropertyRequestDto>
    {
        public CreatePropertyRequestValidator()
        {
            RuleFor(x => x.Title).NotEmpty().MaximumLength(100);

            RuleFor(x => x.Description).NotEmpty();

            RuleFor(x => x.City).NotEmpty();

            RuleFor(x => x.State).NotEmpty();

            RuleFor(x => x.ZipCode).NotEmpty();

            RuleFor(x => x.Price).GreaterThan(0);

            RuleFor(x => x.Size).GreaterThan(0);

            RuleFor(x => x.PropertyTypeId).GreaterThan(0);

            RuleFor(x => x.ListingTypeId).GreaterThan(0);

            RuleFor(x => x.StatusId).GreaterThan(0);
        }
    }
}
