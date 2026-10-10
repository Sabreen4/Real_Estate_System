using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Offers.Command
{
    public record UpdateOfferStatusCommand(int Id, string Status) : IRequest<Unit>;

    public class UpdateOfferStatusCommandHandler : IRequestHandler<UpdateOfferStatusCommand, Unit>
    {
        private readonly IOfferRepository _repository;
        private readonly ILogger<UpdateOfferStatusCommandHandler> _logger;

        public UpdateOfferStatusCommandHandler(
            IOfferRepository repository,
            ILogger<UpdateOfferStatusCommandHandler> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<Unit> Handle(
            UpdateOfferStatusCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Updating offer status. OfferId: {OfferId}, NewStatus: {Status}",
                request.Id,
                request.Status
            );

            var offer = await _repository.GetByIdAsync(request.Id);
            if (offer == null)
            {
                _logger.LogError("Offer with Id {OfferId} not found", request.Id);
                throw new KeyNotFoundException($"Offer with Id {request.Id} not found");
            }

            var status = await _repository.GetStatusByKeyAsync(request.Status);
            if (status == null)
            {
                _logger.LogError(
                    "Invalid status '{Status}' provided for OfferId {OfferId}",
                    request.Status,
                    request.Id
                );
                throw new ArgumentException($"Invalid status '{request.Status}'");
            }

            offer.StatusId = status.Id;

            await _repository.UpdateAsync(offer);

            _logger.LogInformation(
                "Offer status updated successfully. OfferId: {OfferId}, StatusId: {StatusId}",
                offer.Id,
                offer.StatusId
            );

            return Unit.Value;
        }
    }
}
