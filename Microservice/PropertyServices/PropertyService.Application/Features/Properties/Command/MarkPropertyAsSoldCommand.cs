using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Properties.Command
{
    // Command
    public record MarkPropertyAsSoldCommand(int PropertyId) : IRequest<bool>;

    // Handler
    public class MarkPropertyAsSoldCommandHandler : IRequestHandler<MarkPropertyAsSoldCommand, bool>
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<MarkPropertyAsSoldCommandHandler> _logger;

        public MarkPropertyAsSoldCommandHandler(
            IPropertyRepository propertyRepository,
            ILogger<MarkPropertyAsSoldCommandHandler> logger
        )
        {
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<bool> Handle(
            MarkPropertyAsSoldCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "MarkPropertyAsSold started for PropertyId={PropertyId}",
                request.PropertyId
            );

            // Get property
            var property = await _propertyRepository.GetByIdAsync(request.PropertyId);

            if (property == null)
            {
                throw new Exception("Property not found");
            }

            //  Get SOLD status from DB
            var soldStatus = await _propertyRepository.GetStatusByKeyAsync("SOLD");

            if (soldStatus == null)
            {
                throw new Exception("SOLD status not found in RefTerm");
            }

            //  Update status
            property.StatusId = soldStatus.Id;
            property.UpdatedDate = DateTime.UtcNow;

            //  Save changes
            await _propertyRepository.UpdateAsync(property);
            await _propertyRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Property marked as SOLD successfully: PropertyId={PropertyId}",
                request.PropertyId
            );

            return true;
        }
    }
}
