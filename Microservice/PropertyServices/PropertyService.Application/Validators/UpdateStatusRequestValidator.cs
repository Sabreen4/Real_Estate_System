using FluentValidation;
using PropertyService.Application.DTOs;

namespace PropertyService.Application.Validators
{
    public class UpdateStatusRequestValidator : AbstractValidator<UpdateOfferStatusRequestDto>
    {
        public UpdateStatusRequestValidator()
        {
            RuleFor(x => x.Status)
                .NotEmpty()
                .Must(s => new[] { "PENDING", "APPROVED", "REJECTED" }.Contains(s.ToUpper()))
                .WithMessage("Invalid status value");
        }
    }
}
