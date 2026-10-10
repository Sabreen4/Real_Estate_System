using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Features.Offers.Command
{
    public record CreateOfferCommand(int PropertyId, int UserId, decimal OfferAmount)
        : IRequest<OfferDto>;

    public class CreateOfferCommandHandler : IRequestHandler<CreateOfferCommand, OfferDto>
    {
        private readonly IOfferRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateOfferCommandHandler> _logger;

        public CreateOfferCommandHandler(
            IOfferRepository repository,
            IMapper mapper,
            ILogger<CreateOfferCommandHandler> logger
        )
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<OfferDto> Handle(
            CreateOfferCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Creating offer for PropertyId {PropertyId} by UserId {UserId} with amount {OfferAmount}",
                request.PropertyId,
                request.UserId,
                request.OfferAmount
            );

            var status = await _repository.GetStatusByKeyAsync("PENDING");
            if (status == null)
            {
                _logger.LogError(
                    "Pending status not found when creating offer for PropertyId {PropertyId}",
                    request.PropertyId
                );
                throw new KeyNotFoundException($"Pending status not found");
            }

            var offer = new Offer
            {
                PropertyId = request.PropertyId,
                UserId = request.UserId,
                OfferAmount = request.OfferAmount,
                StatusId = status.Id,
            };

            var result = await _repository.AddAsync(offer);

            await _repository.SaveChangesAsync();

            _logger.LogInformation(
                "Offer created with Id {OfferId} for PropertyId {PropertyId}",
                result.Id,
                request.PropertyId
            );

            return _mapper.Map<OfferDto>(result);
        }
    }
}
