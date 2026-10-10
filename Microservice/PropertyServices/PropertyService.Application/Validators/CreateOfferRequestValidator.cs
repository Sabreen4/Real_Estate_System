using FluentValidation;
using PropertyService.Application.DTOs;

namespace PropertyService.Application.Validators
{
    public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
    {
        public CreateOfferRequestValidator()
        {
            RuleFor(x => x.OfferAmount).GreaterThan(0).WithMessage("Offer must be greater than 0");
        }
    }
}
