using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Features.PropertyImages.Command
{
    public record UploadPropertyImagesCommand(
        int PropertyId,
        List<byte[]> Files,
        List<string> ContentTypes
    ) : IRequest<List<PropertyImageDto>>;

    public class UploadPropertyImagesCommandHandler
        : IRequestHandler<UploadPropertyImagesCommand, List<PropertyImageDto>>
    {
        private readonly IPropertyImageRepository _repository;
        private readonly ILogger<UploadPropertyImagesCommandHandler> _logger;

        public UploadPropertyImagesCommandHandler(
            IPropertyImageRepository repository,
            ILogger<UploadPropertyImagesCommandHandler> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<List<PropertyImageDto>> Handle(
            UploadPropertyImagesCommand request,
            CancellationToken cancellationToken
        )
        {
            if (request.Files.Count != request.ContentTypes.Count)
                throw new ArgumentException(
                    $"Files and ContentTypes counts must match. "
                        + $"Got {request.Files.Count} file(s) and {request.ContentTypes.Count} content type(s)."
                );
            var propertyExists = await _repository.PropertyExistsAsync(request.PropertyId);
            if (!propertyExists)
            {
                throw new KeyNotFoundException($"Property with Id={request.PropertyId} not found.");
            }

            _logger.LogInformation(
                "Uploading {Count} images for PropertyId={PropertyId}",
                request.Files.Count,
                request.PropertyId
            );

            var images = new List<PropertyImage>(capacity: request.Files.Count);

            for (int i = 0; i < request.Files.Count; i++)
            {
                images.Add(
                    new PropertyImage
                    {
                        PropertyId = request.PropertyId,
                        ImageData = request.Files[i],
                        ContentType = request.ContentTypes[i],
                    }
                );
            }

            await _repository.AddRangeAsync(images);

            await _repository.SaveChangesAsync();

            _logger.LogInformation(
                "Uploaded {Count} images for PropertyId={PropertyId}",
                images.Count,
                request.PropertyId
            );

            return images
                .Select(img => new PropertyImageDto
                {
                    Id = img.Id,
                    ImageData = img.ImageData,
                    ContentType = img.ContentType,
                })
                .ToList();
        }
    }
}
