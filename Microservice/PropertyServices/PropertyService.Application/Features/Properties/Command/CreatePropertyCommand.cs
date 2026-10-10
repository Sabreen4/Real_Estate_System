using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;


namespace PropertyService.Application.Features.Properties.Command
{
    public record CreatePropertyCommand(int UserId, CreatePropertyRequestDto Dto)
        : IRequest<PropertyResponseDto>;

    public class CreatePropertyCommandHandler
        : IRequestHandler<CreatePropertyCommand, PropertyResponseDto>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<CreatePropertyCommandHandler> _logger;

        public CreatePropertyCommandHandler(
            IPropertyRepository propertyRepository,
            ILogger<CreatePropertyCommandHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<PropertyResponseDto> Handle(
            CreatePropertyCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling CreatePropertyCommand for UserId={UserId}",
                request.UserId
            );

            var dto = request.Dto;

            var property = new Property
            {
                UserId = request.UserId,
                Title = dto.Title,
                Description = dto.Description,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                Price = dto.Price,
                Size = dto.Size,
                PropertyTypeId = dto.PropertyTypeId,
                ListingTypeId = dto.ListingTypeId,
                StatusId = dto.StatusId,
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false,
            };

            var saved = await _propertyRepository.AddAsync(property);
            await _propertyRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Property created: PropertyId={Id}, UserId={UserId}",
                saved.Id,
                request.UserId
            );

            return new PropertyResponseDto
            {
                Id = saved.Id,
                UserId = saved.UserId,
                Title = saved.Title,
                Description = saved.Description,
                City = saved.City,
                State = saved.State,
                ZipCode = saved.ZipCode,
                Price = saved.Price,
                Size = saved.Size,
                PropertyTypeId = saved.PropertyTypeId,
                PropertyType = saved.PropertyType?.Key ?? string.Empty,
                ListingTypeId = saved.ListingTypeId,
                ListingType = saved.ListingType?.Key ?? string.Empty,
                StatusId = saved.StatusId,
                Status = saved.Status?.Key ?? string.Empty,
                Images = new List<PropertyImageDto>(),
            };
        }
    }
}
