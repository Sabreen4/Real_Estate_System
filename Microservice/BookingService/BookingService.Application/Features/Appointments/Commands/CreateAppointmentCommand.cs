using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Exceptions;
using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Appointments.Commands
{
    public record CreateAppointmentCommand(
        int PropertyId, int UserId, DateTime VisitDate, string Token)
        : IRequest<AppointmentDto>;

    public class CreateAppointmentCommandHandler
        : IRequestHandler<CreateAppointmentCommand, AppointmentDto>
    {
        private readonly IAppointmentRepository _repository;
        private readonly IPropertyApi _propertyApi;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateAppointmentCommandHandler> _logger;

        public CreateAppointmentCommandHandler(
            IAppointmentRepository repository,
            IPropertyApi propertyApi,
            IMapper mapper,
            ILogger<CreateAppointmentCommandHandler> logger)
        {
            _repository  = repository;
            _propertyApi = propertyApi;
            _mapper      = mapper;
            _logger      = logger;
        }

        public async Task<AppointmentDto> Handle(
            CreateAppointmentCommand request,
            CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "Creating appointment. PropertyId: {PropertyId}, UserId: {UserId}, VisitDate: {VisitDate}",
                request.PropertyId, request.UserId, request.VisitDate);

            // ── 1. Fetch AgentId from PropertyService ─────────────────
            var property = await _propertyApi.GetPropertyByIdAsync(
                request.PropertyId, request.Token);

            if (property == null)
                throw new Exception("Property not found");

            // ── 2. Check slot by agentId — agent can't be double booked
            var isBooked = await _repository.IsSlotAlreadyBookedAsync(
                request.PropertyId, property.AgentId, request.VisitDate);

            if (isBooked)
                throw new SlotUnavailableException(
                    "This slot is already booked. Please choose another time.");

            // ── 3. Create appointment ─────────────────────────────────
            var pendingStatus = await _repository.GetStatusByKeyAsync("PENDING");
            if (pendingStatus == null)
            {
                _logger.LogError("Pending status not found for creating appointment");
                throw new Exception("Pending status not found");
            }

            var appointment = new Appointment
            {
                PropertyId = request.PropertyId,
                UserId     = request.UserId,
                AgentId    = property.AgentId,
                VisitDate  = request.VisitDate,
                StatusId   = pendingStatus.Id,
            };

            var result = await _repository.AddAsync(appointment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation(
                "Appointment created successfully. AppointmentId: {Id}, AgentId: {AgentId}",
                result.Id, property.AgentId);

            return _mapper.Map<AppointmentDto>(result);
        }
    }
}