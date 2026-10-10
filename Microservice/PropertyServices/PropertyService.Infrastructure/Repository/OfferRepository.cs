using Microsoft.EntityFrameworkCore;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using PropertyService.Infrastructure.Persistence;

namespace PropertyService.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for managing <see cref="Offer"/> entities.
    /// Handles CRUD operations and status retrieval.
    /// </summary>
    public class OfferRepository : BaseRepository<Offer>, IOfferRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Constructor to inject the application's DbContext.
        /// </summary>
        /// <param name="context">Database context instance.</param>
        public OfferRepository(AppDbContext context)
            : base(context)
        {
            _context = context;
        }

        /// <summary>
        /// Adds a new offer to the DbContext.
        /// </summary>
        /// <param name="offer">The offer entity to add.</param>
        /// <returns>The added <see cref="Offer"/> entity.</returns>
        public async Task<Offer> AddAsync(Offer offer)
        {
            _context.Offers.Add(offer);
            // SaveChangesAsync removed — handler owns the unit of work
            return offer;
        }

        /// <summary>
        /// Updates an existing offer in the DbContext.
        /// </summary>
        /// <param name="offer">The offer entity with updated values.</param>
        public async Task UpdateAsync(Offer offer)
        {
            _context.Offers.Update(offer);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Offer>> GetByAgentIdAsync(
            int agentId,
            CancellationToken cancellationToken
        )
        {
            return await _context
                .Offers.Include(o => o.Property)
                .Include(o => o.Status)
                .Where(o => o.Property.UserId == agentId)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<OfferDto>> GetBuyerOffersAsync(int buyerId)
        {
            var offers = await _context
                .Offers.Include(o => o.Property)
                .Include(o => o.Status)
                .Where(o => o.UserId == buyerId)
                .ToListAsync();

            return offers
                .Select(o => new OfferDto
                {
                    Id = o.Id,

                    PropertyId = o.PropertyId,

                    OfferAmount = o.OfferAmount,

                    Status = o.Status != null ? o.Status.Key : "PENDING",

                    PropertyTitle = o.Property != null ? o.Property.Title : "Property",
                    AgentId = o.Property != null ? o.Property.UserId : 0,
                })
                .ToList();
        }

        /// <summary>
        /// Persists all changes made in the DbContext to the database.
        /// </summary>
        /// <summary>
        /// Retrieves an offer by its ID, including its status.
        /// </summary>
        /// <param name="id">The ID of the offer to retrieve.</param>
        /// <returns>The <see cref="Offer"/> entity if found; otherwise, null.</returns>
        public async Task<Offer?> GetByIdAsync(int id)
        {
            return await _context
                .Offers.Include(x => x.Status)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        /// <summary>
        /// Retrieves a reference term for an offer status by its key.
        /// </summary>
        /// <param name="key">The key of the status term.</param>
        /// <returns>The <see cref="RefTerm"/> entity if found; otherwise, null.</returns>
    }
}
