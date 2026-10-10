using MediatR;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Offers.Query;

// ── Query ─────────────────────────────────────────────────────────────────
public record GetAgentOffersQuery(int AgentId) : IRequest<List<OfferDto>>;

// ── Handler ───────────────────────────────────────────────────────────────
public class GetAgentOffersQueryHandler : IRequestHandler<GetAgentOffersQuery, List<OfferDto>>
{
    private readonly IOfferRepository _offerRepo;

    public GetAgentOffersQueryHandler(IOfferRepository offerRepo)
    {
        _offerRepo = offerRepo;
    }

    public async Task<List<OfferDto>> Handle(
        GetAgentOffersQuery request,
        CancellationToken cancellationToken
    )
    {
        var offers = await _offerRepo.GetByAgentIdAsync(request.AgentId, cancellationToken);

        return offers
            .Select(o => new OfferDto
            {
                Id = o.Id,
                PropertyId = o.PropertyId,

                OfferAmount = o.OfferAmount,
                UserId = o.UserId,
                Status = o.Status?.Key ?? "PENDING", // matches template: o.status
            })
            .ToList();
    }
}
