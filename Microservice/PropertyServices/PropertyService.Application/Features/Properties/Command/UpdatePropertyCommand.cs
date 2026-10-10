using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Features.Properties.Command
{
    // ── Command now carries the raw request directly
    public record UpdatePropertyCommand(int UserId, bool IsAdmin, UpdatePropertyRequestDto Request)
        : IRequest<PropertyResponseDto?>;

    public class UpdatePropertyCommandHandler
        : IRequestHandler<UpdatePropertyCommand, PropertyResponseDto?>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IPropertyImageRepository _imageRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdatePropertyCommandHandler> _logger;

        public UpdatePropertyCommandHandler(
            IPropertyRepository propertyRepository,
            IPropertyImageRepository imageRepository,
            IMapper mapper,
            ILogger<UpdatePropertyCommandHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _imageRepository = imageRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PropertyResponseDto?> Handle(
            UpdatePropertyCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling UpdatePropertyCommand: PropertyId={PropertyId}, UserId={UserId}, IsAdmin={IsAdmin}",
                request.Request.Id,
                request.UserId,
                request.IsAdmin
            );

            try
            {
                // ── Fetch existing property
                var property = await _propertyRepository.GetByIdAsync(request.Request.Id);
                if (property is null)
                {
                    _logger.LogWarning(
                        "Property not found: PropertyId={PropertyId}",
                        request.Request.Id
                    );
                    return null;
                }

                // ── Ownership check
                if (!request.IsAdmin && property.UserId != request.UserId)
                {
                    _logger.LogWarning(
                        "Unauthorized update attempt: PropertyId={PropertyId}, UserId={UserId}",
                        request.Request.Id,
                        request.UserId
                    );
                    throw new UnauthorizedAccessException(
                        "You do not have permission to update this property."
                    );
                }

                // ── Map scalar fields
                _mapper.Map(request.Request, property);
                property.UpdatedDate = DateTime.UtcNow;

                // ── Remove images by Id
                if (request.Request.RemoveImageIds is { Count: > 0 })
                {
                    await _imageRepository.DeleteByIdsAsync(request.Request.RemoveImageIds);
                    _logger.LogInformation(
                        "Removed {Count} images for PropertyId={PropertyId}",
                        request.Request.RemoveImageIds.Count,
                        request.Request.Id
                    );
                }

                // ── Process and add new images
                if (request.Request.NewImages is { Count: > 0 })
                {
                    var newImages = await ProcessImagesAsync(
                        request.Request.NewImages,
                        property.Id
                    );
                    await _imageRepository.AddRangeAsync(newImages);
                    _logger.LogInformation(
                        "Added {Count} new images for PropertyId={PropertyId}",
                        newImages.Count,
                        request.Request.Id
                    );
                }

                await _propertyRepository.UpdateAsync(property);

                // ── Re-fetch for full navigation properties
                var updated = await _propertyRepository.GetByIdAsync(request.Request.Id);

                _logger.LogInformation(
                    "Property updated successfully: PropertyId={PropertyId}",
                    request.Request.Id
                );

                return _mapper.Map<PropertyResponseDto>(updated);
            }
            catch (Exception ex) when (ex is not UnauthorizedAccessException)
            {
                _logger.LogError(
                    ex,
                    "Error while updating property: PropertyId={PropertyId}, UserId={UserId}",
                    request.Request.Id,
                    request.UserId
                );
                throw;
            }
        }

        private async Task<ICollection<PropertyImage>> ProcessImagesAsync(
            ICollection<ImageUploadDto> newImages,
            int id
        )
        {
            throw new NotImplementedException();
        }

        // ── Private helper: converts IFormFile list → PropertyImage list
        private static async Task<List<PropertyImage>> ProcessImagesAsync(
            IList<IFormFile> files,
            int propertyId
        )
        {
            var images = new List<PropertyImage>();

            foreach (var file in files)
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                images.Add(
                    new PropertyImage
                    {
                        PropertyId = propertyId,
                        ImageData = ms.ToArray(),
                        ContentType = file.ContentType,
                    }
                );
            }

            return images;
        }
    }
}
