using FluentValidation;
using BookingService.Application.DTOs;

namespace BookingService.Application.Validators
{
    public class CreateTransactionRequestValidator : AbstractValidator<CreateTransactionRequest>
    {
        public CreateTransactionRequestValidator()
        {
            RuleFor(x => x.PropertyId).GreaterThan(0);

            RuleFor(x => x.SellerId).GreaterThan(0);

            RuleFor(x => x.Amount).GreaterThan(0);
        }
    }
}
