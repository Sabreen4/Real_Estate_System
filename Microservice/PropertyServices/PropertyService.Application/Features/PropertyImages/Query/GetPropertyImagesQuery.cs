using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;


namespace PropertyService.Application.Features.PropertyImages.Query
{
    public record GetPropertyImagesQuery(int PropertyId) : IRequest<List<PropertyImageDto>>;

    public class GetPropertyImagesQueryHandler
        : IRequestHandler<GetPropertyImagesQuery, List<PropertyImageDto>>
    {
        private readonly IPropertyImageRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetPropertyImagesQueryHandler> _logger;

        public GetPropertyImagesQueryHandler(
            IPropertyImageRepository repository,
            IMapper mapper,
            ILogger<GetPropertyImagesQueryHandler> logger
        )
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<PropertyImageDto>> Handle(
            GetPropertyImagesQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Fetching images for PropertyId {PropertyId}",
                request.PropertyId
            );

            var images = await _repository.GetByPropertyIdAsync(request.PropertyId);

            _logger.LogInformation(
                "Retrieved {Count} images for PropertyId {PropertyId}",
                images.Count,
                request.PropertyId
            );

            return _mapper.Map<List<PropertyImageDto>>(images);
        }
    }
}
