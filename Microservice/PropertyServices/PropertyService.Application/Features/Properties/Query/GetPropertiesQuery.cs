using System.Text.Json;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PropertService.Application.Common;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Properties.Query
{
    public record GetPropertiesQuery(
        PropertyFilterDto Filter,
        int PageNumber = 1,
        int PageSize = 10,
        int? UserId = null 
    ) : IRequest<PaginatedResult<PropertyResponseDto>>;

    public class GetPropertiesQueryHandler
        : IRequestHandler<GetPropertiesQuery, PaginatedResult<PropertyResponseDto>>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetPropertiesQueryHandler> _logger;

        public GetPropertiesQueryHandler(
            IPropertyRepository propertyRepository,
            IMapper mapper,
            ILogger<GetPropertiesQueryHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PaginatedResult<PropertyResponseDto>> Handle(
            GetPropertiesQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling GetPropertiesQuery: PageNumber={PageNumber}, PageSize={PageSize}, Filter={Filter}",
                request.PageNumber,
                request.PageSize,
                JsonSerializer.Serialize(request.Filter)
            );

            var filter = request.Filter;

            // Convert PropertyTypeName → PropertyTypeId
            if (!string.IsNullOrWhiteSpace(filter.PropertyTypeName))
            {
                var propType = await _propertyRepository.GetPropertyTypeByKeyAsync(
                    filter.PropertyTypeName
                );
                filter.PropertyTypeId = propType?.Id;
            }

            // Convert ListingTypeName → ListingTypeId
            if (!string.IsNullOrWhiteSpace(filter.ListingTypeName))
            {
                var listType = await _propertyRepository.GetListingTypeByKeyAsync(
                    filter.ListingTypeName
                );
                filter.ListingTypeId = listType?.Id;
            }

            _logger.LogInformation(
                "Filtering by PropertyTypeId={PropertyTypeId}, ListingTypeId={ListingTypeId}",
                filter.PropertyTypeId,
                filter.ListingTypeId
            );

            // Call repository
            var (items, totalCount) = await _propertyRepository.GetFilteredAsync(
                city: filter.City,
                state: filter.State,
                minPrice: filter.MinPrice,
                maxPrice: filter.MaxPrice,
                propertyTypeId: filter.PropertyTypeId,
                listingTypeId: filter.ListingTypeId,
                statusId: filter.StatusId,
                pageNumber: request.PageNumber,
                pageSize: request.PageSize
            );

            _logger.LogInformation(
                "Fetched {Count} properties (TotalCount={TotalCount})",
                items.Count,
                totalCount
            );

            var dtos = _mapper.Map<List<PropertyResponseDto>>(items);

            return new PaginatedResult<PropertyResponseDto>(
                dtos,
                totalCount,
                request.PageNumber,
                request.PageSize
            );
        }
    }
}
