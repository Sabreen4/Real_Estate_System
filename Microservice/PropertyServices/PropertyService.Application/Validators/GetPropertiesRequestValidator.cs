using FluentValidation;

public class GetPropertiesRequestValidator : AbstractValidator<GetPropertiesRequest>
{
    public GetPropertiesRequestValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1).WithMessage("Page number must be >= 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Page size must be between 1 and 100");
    }
}
