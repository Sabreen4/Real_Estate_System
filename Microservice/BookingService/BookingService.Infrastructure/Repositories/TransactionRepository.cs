using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using BookingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for managing <see cref="Transaction"/> entities.
    /// Handles CRUD operations and status lookups.
    /// </summary>
    public class TransactionRepository : BaseRepository<Transaction>, ITransactionRepository
    {
        private readonly AppDbContext _context;
        private readonly IPropertyServiceClient _propertyClient;

        /// <summary>
        /// Constructor to inject the application's DbContext.
        /// </summary>
        /// <param name="context">Database context instance.</param>
        public TransactionRepository(AppDbContext context, IPropertyServiceClient propertyClient) // ← inject
            : base(context)
        {
            _context = context;
            _propertyClient = propertyClient;
        }

        /// <summary>
        /// Adds a new transaction to the database.
        /// </summary>
        /// <param name="transaction">The <see cref="Transaction"/> entity to add.</param>
        /// <returns>The added transaction entity.</returns>
        public async Task<Transaction> AddAsync(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            return transaction;
        }

        /// <summary>
        /// Updates an existing transaction in the database.
        /// </summary>
        /// <param name="transaction">The <see cref="Transaction"/> entity with updated values.</param>
        public async Task UpdateAsync(Transaction transaction)
        {
            _context.Transactions.Update(transaction);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Persists all changes made in the DbContext to the database.
        /// </summary>
        /// <summary>
        /// Retrieves a transaction by its ID, including its status.
        /// </summary>
        /// <param name="id">The ID of the transaction.</param>
        /// <returns>The <see cref="Transaction"/> entity if found; otherwise, null.</returns>
        public async Task<Transaction?> GetByIdAsync(int id)
        {
            return await _context
                .Transactions.Include(x => x.Status)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        /// <summary>
        /// Retrieves all transactions associated with a specific property.
        /// </summary>
        /// <param name="propertyId">The ID of the property.</param>
        /// <returns>List of <see cref="Transaction"/> entities for the property.</returns>
        public async Task<List<Transaction>> GetByPropertyIdAsync(int propertyId)
        {
            return await _context
                .Transactions.Include(x => x.Status)
                .Where(x => x.PropertyId == propertyId)
                .ToListAsync();
        }

        public async Task<List<Transaction>> GetByAgentIdAsync(int agentId)
        {
            return await _context
                .Transactions.Include(t => t.Status)
                .Where(t => t.SellerId == agentId)
                .ToListAsync();
        }

        // Infrastructure/Repositories/TransactionRepository.cs
        public async Task<List<TransactionDto>> GetByBuyerIdAsync(int buyerId, string token)
        {
            // Step 1: fetch transactions from DB
            var transactions = await _context
                .Transactions.Include(t => t.Status)
                .Where(t => t.BuyerId == buyerId)
                .ToListAsync();

            // Step 2: fetch property titles in parallel via Refit
            var propertyIds = transactions.Select(t => t.PropertyId).Distinct().ToList();

            var titleMap = new Dictionary<int, string>();

            await Task.WhenAll(
                propertyIds.Select(async pid =>
                {
                    try
                    {
                        var property = await _propertyClient.GetPropertyByIdAsync(pid, token);
                        Console.WriteLine($"[PropertyClient] pid={pid} title={property?.Title}");
                        titleMap[pid] = property?.Title ?? $"Property #{pid}";
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[PropertyClient] FAILED pid={pid} error={ex.Message}");
                        titleMap[pid] = $"Property #{pid}";
                    }
                })
            );

            // Step 3: map to DTO — all fields included
            return transactions
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    PropertyId = t.PropertyId,
                    PropertyTitle = titleMap[t.PropertyId],
                    BuyerId = t.BuyerId,
                    SellerId = t.SellerId,
                    Amount = t.Amount,

                    Status = t.Status.Key,
                    PaymentDate = t.TransactionDate,
                })
                .ToList();
        }
    }
}

/// <summary>
/// Retrieves a reference term for a transaction status by its key.
/// </summary>
/// <param name="key">The key of the status.</param>
/// <returns>The <see cref="RefTerm"/> entity if found; otherwise, null.</returns>
