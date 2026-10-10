using BookingService.Application.DTOs;
using FluentValidation;

public class UpdateStatusRequestValidator : AbstractValidator<UpdateStatusRequest>
{
    public UpdateStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required")
            .NotNull()
            .Must(BeValidStatus)
            .WithMessage("Invalid status");
    }

    private bool BeValidStatus(string status)
    {
        var allowed = new[] { "approved", "rejected", "active", "pending", "sold" };

        return allowed.Contains(status.ToLower());
    }
}
