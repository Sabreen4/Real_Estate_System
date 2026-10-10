using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Properties.Query
{
    // Query
    public record GetPropertyByIdQuery(int Id) : IRequest<PropertyResponseDto?>;

    //  Handler
    public class GetPropertyByIdQueryHandler
        : IRequestHandler<GetPropertyByIdQuery, PropertyResponseDto?>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<GetPropertyByIdQueryHandler> _logger;

        public GetPropertyByIdQueryHandler(
            IPropertyRepository propertyRepository,
            ILogger<GetPropertyByIdQueryHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<PropertyResponseDto?> Handle(
            GetPropertyByIdQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation("Fetching property by Id={Id}", request.Id);

            var property = await _propertyRepository.GetByIdAsync(request.Id);
            if (property is null)
            {
                _logger.LogWarning("Property with Id={Id} not found", request.Id);
                return null;
            }

            _logger.LogInformation("Property with Id={Id} found", request.Id);

            return new PropertyResponseDto
            {
                Id = property.Id,
                UserId = property.UserId,
                Title = property.Title,
                Description = property.Description,
                City = property.City,
                State = property.State,
                ZipCode = property.ZipCode,
                Price = property.Price,
                Size = property.Size,
                PropertyTypeId = property.PropertyTypeId,
                PropertyType = property.PropertyType?.Key ?? string.Empty,
                ListingTypeId = property.ListingTypeId,
                ListingType = property.ListingType?.Key ?? string.Empty,
                StatusId = property.StatusId,
                Status = property.Status?.Key ?? string.Empty,
                Images =
                    property
                        .Images?.Select(i => new PropertyImageDto
                        {
                            Id = i.Id,
                            ImageData = i.ImageData,
                        })
                        .ToList()
                    ?? new List<PropertyImageDto>(),
            };
        }
    }
}
