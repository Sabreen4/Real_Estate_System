using BookingService.Domain.Entities;

namespace BookingService.Application.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<Appointment> AddAsync(Appointment appointment);
        Task<Appointment?> GetByIdAsync(int id);
        Task UpdateAsync(Appointment appointment);

        Task<bool> IsSlotAlreadyBookedAsync(int propertyId, int agentId, DateTime visitDate);
        Task<List<string>> GetBookedVisitDatesAsync(int propertyId, int agentId);

        Task<RefTerm?> GetStatusByKeyAsync(string key);
        Task SaveChangesAsync();
        Task<List<Appointment>> GetByAgentPropertyIdsAsync(
            List<int> propertyIds,
            CancellationToken cancellationToken);
    }
}