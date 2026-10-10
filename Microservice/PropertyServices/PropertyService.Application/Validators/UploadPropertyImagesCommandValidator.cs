using FluentValidation;
using PropertyService.Application.Features.PropertyImages.Command;

namespace PropertyService.Application.Validators
{
    public class UploadPropertyImagesCommandValidator
        : AbstractValidator<UploadPropertyImagesCommand>
    {
        private static readonly HashSet<string> _allowedContentTypes = new(
            StringComparer.OrdinalIgnoreCase
        )
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        };

        public UploadPropertyImagesCommandValidator()
        {
            RuleFor(x => x.PropertyId)
                .GreaterThan(0)
                .WithMessage("PropertyId must be a positive integer.");

            RuleFor(x => x.Files)
                .NotNull()
                .NotEmpty()
                .WithMessage("At least one file must be provided.");

            RuleFor(x => x.ContentTypes)
                .NotNull()
                .NotEmpty()
                .WithMessage("At least one content type must be provided.");

            //  The core fix — counts must align
            RuleFor(x => x)
                .Must(x => x.Files.Count == x.ContentTypes.Count)
                .WithName("Files")
                .WithMessage("Files and ContentTypes must have the same number of entries.");

            // Validate each individual content type
            RuleForEach(x => x.ContentTypes)
                .Must(ct => _allowedContentTypes.Contains(ct))
                .WithMessage("'{PropertyValue}' is not a supported image content type.");

            // Validate each file is non-empty
            RuleForEach(x => x.Files)
                .Must(f => f is { Length: > 0 })
                .WithMessage("One or more uploaded files are empty.");
        }
    }
}
