using MediatR;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Features.Offers.Query
{
    // QUERY
    public class GetBuyerOffersQuery : IRequest<List<OfferDto>>
    {
        public int BuyerId { get; set; }

        public GetBuyerOffersQuery(int buyerId)
        {
            BuyerId = buyerId;
        }
    }

    // HANDLER
    public class GetBuyerOffersQueryHandler : IRequestHandler<GetBuyerOffersQuery, List<OfferDto>>
    {
        private readonly IOfferRepository _offerRepository;

        public GetBuyerOffersQueryHandler(IOfferRepository offerRepository)
        {
            _offerRepository = offerRepository;
        }

        public async Task<List<OfferDto>> Handle(
            GetBuyerOffersQuery request,
            CancellationToken cancellationToken
        )
        {
            return await _offerRepository.GetBuyerOffersAsync(request.BuyerId);
        }
    }
}
