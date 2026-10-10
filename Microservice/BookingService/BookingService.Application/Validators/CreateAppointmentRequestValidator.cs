using BookingService.Application.DTOs;
using FluentValidation;

namespace BookingService.Application.Validators
{
    public class CreateAppointmentRequestValidator : AbstractValidator<CreateAppointmentRequest>
    {
        public CreateAppointmentRequestValidator()
        {
            RuleFor(x => x.VisitDate)
                .GreaterThan(_ => DateTime.UtcNow)
                .WithMessage("Visit date must be in the future");
        }
    }
}
