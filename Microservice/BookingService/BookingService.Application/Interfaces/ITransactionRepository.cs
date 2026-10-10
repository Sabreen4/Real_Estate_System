using BookingService.Application.DTOs;
using BookingService.Domain.Entities;

namespace BookingService.Application.Interfaces
{
    public interface ITransactionRepository
    {
        Task<Transaction> AddAsync(Transaction transaction);
        Task<Transaction?> GetByIdAsync(int id);
        Task<List<Transaction>> GetByPropertyIdAsync(int propertyId);
       Task<List<TransactionDto>> GetByBuyerIdAsync(int buyerId,string token);
        Task<RefTerm?> GetStatusByKeyAsync(string key);
        Task SaveChangesAsync();
        Task UpdateAsync(Transaction transaction);
        Task<List<Transaction>> GetByAgentIdAsync(int agentId);
    }
}
