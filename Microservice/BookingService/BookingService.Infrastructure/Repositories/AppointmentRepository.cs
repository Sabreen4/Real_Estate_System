using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using BookingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for managing Appointment entities.
    /// Implements CRUD operations and related queries.
    /// </summary>
    public class AppointmentRepository : BaseRepository<Appointment>, IAppointmentRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Constructor to inject the application's DbContext.
        /// </summary>
        public AppointmentRepository(AppDbContext context)
            : base(context)
        {
            _context = context;
        }

        /// <summary>
        /// Adds a new appointment to the DbContext.
        /// </summary>
        public async Task<Appointment> AddAsync(Appointment appointment)
        {
            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();

            return appointment;
        }

        /// <summary>
        /// Updates an existing appointment.
        /// </summary>
        public async Task UpdateAsync(Appointment appointment)
        {
            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Saves changes to database.
        /// </summary>
        /// <summary>
        /// Retrieves an appointment by its ID.
        /// Only includes Status (if navigation exists).
        /// </summary>
        public async Task<Appointment?> GetByIdAsync(int id)
        {
            return await _context
                .Appointments.Include(a => a.Status) // Keep only if Status navigation exists
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Appointment>> GetByAgentPropertyIdsAsync(
            List<int> propertyIds,
            CancellationToken cancellationToken
        )
        {
            return await _context
                .Appointments.Include(a => a.Status)
                .Where(a => propertyIds.Contains(a.PropertyId))
                .OrderByDescending(a => a.VisitDate)
                .ToListAsync(cancellationToken);
        }

        // AppointmentRepository.cs — add this method
        public async Task<bool> IsSlotAlreadyBookedAsync(
            int propertyId,
            int agentId,
            DateTime visitDate
        )
        {
            return await _context.Appointments.AnyAsync(a =>
                (a.AgentId == agentId || a.PropertyId == propertyId) && a.VisitDate == visitDate
            );
        }

        public async Task<List<string>> GetBookedVisitDatesAsync(int propertyId, int agentId)
        {
            var dates = await _context
                .Appointments.Where(a => a.AgentId == agentId || a.PropertyId == propertyId)
                .Select(a => a.VisitDate)
                .ToListAsync();

            return dates.Select(d => d.ToLocalTime().ToString("yyyy-MM-ddTHH:mm")).ToList();
        }

        /// <summary>
        /// Retrieves a reference term for an appointment status by key.
        /// </summary>
    }
}
