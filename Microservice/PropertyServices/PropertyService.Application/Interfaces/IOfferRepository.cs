using PropertyService.Application.DTOs;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Interfaces
{
    public interface IOfferRepository
    {
        Task<Offer> AddAsync(Offer offer);

        Task<Offer?> GetByIdAsync(int id);

        Task UpdateAsync(Offer offer);

        Task<RefTerm?> GetStatusByKeyAsync(string key);
        Task<List<Offer>> GetByAgentIdAsync(int agentId, CancellationToken cancellationToken);
         Task<List<OfferDto>> GetBuyerOffersAsync(int buyerId);
        Task SaveChangesAsync();
    }
}
