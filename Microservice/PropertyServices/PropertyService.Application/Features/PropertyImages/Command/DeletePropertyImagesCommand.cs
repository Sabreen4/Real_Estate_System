using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.PropertyImages.Command
{
    public record DeletePropertyImagesCommand(ICollection<int> ImageIds) : IRequest<Unit>;

    public class DeletePropertyImagesCommandHandler
        : IRequestHandler<DeletePropertyImagesCommand, Unit>
    {
        private readonly IPropertyImageRepository _repository;
        private readonly ILogger<DeletePropertyImagesCommandHandler> _logger;

        public DeletePropertyImagesCommandHandler(
            IPropertyImageRepository repository,
            ILogger<DeletePropertyImagesCommandHandler> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<Unit> Handle(
            DeletePropertyImagesCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Deleting {Count} property images: {Ids}",
                request.ImageIds.Count,
                request.ImageIds
            );

            await _repository.DeleteByIdsAsync(request.ImageIds);

            _logger.LogInformation(
                "Successfully deleted {Count} property images",
                request.ImageIds.Count
            );

            return Unit.Value;
        }
    }
}
