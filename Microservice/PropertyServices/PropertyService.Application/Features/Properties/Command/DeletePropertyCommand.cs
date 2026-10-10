using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Properties.Command
{
    // ── Command
    public record DeletePropertyCommand(int PropertyId, int UserId, bool IsAdmin) : IRequest<bool>;

    // ── Handler
    public class DeletePropertyCommandHandler : IRequestHandler<DeletePropertyCommand, bool>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<DeletePropertyCommandHandler> _logger;

        public DeletePropertyCommandHandler(
            IPropertyRepository propertyRepository,
            ILogger<DeletePropertyCommandHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<bool> Handle(
            DeletePropertyCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling DeletePropertyCommand: PropertyId={PropertyId}, UserId={UserId}, IsAdmin={IsAdmin}",
                request.PropertyId,
                request.UserId,
                request.IsAdmin
            );

            try
            {
                // ── Fetch property
                var property = await _propertyRepository.GetByIdAsync(request.PropertyId);
                if (property is null)
                {
                    _logger.LogWarning(
                        "Property not found: PropertyId={PropertyId}",
                        request.PropertyId
                    );
                    return false;
                }

                // ── Ownership check
                if (!request.IsAdmin && property.UserId != request.UserId)
                {
                    _logger.LogWarning(
                        "Unauthorized deletion attempt: PropertyId={PropertyId}, UserId={UserId}",
                        request.PropertyId,
                        request.UserId
                    );
                    throw new UnauthorizedAccessException(
                        "You do not have permission to delete this property."
                    );
                }

                // ── Delete via repository
                await _propertyRepository.DeleteAsync(property);

                _logger.LogInformation(
                    "Property deleted successfully: PropertyId={PropertyId}, UserId={UserId}",
                    request.PropertyId,
                    request.UserId
                );
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while deleting property: PropertyId={PropertyId}, UserId={UserId}",
                    request.PropertyId,
                    request.UserId
                );
                throw;
            }
        }
    }
}
