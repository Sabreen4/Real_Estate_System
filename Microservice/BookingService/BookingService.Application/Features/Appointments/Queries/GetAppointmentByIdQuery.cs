using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Appointments.Queries
{
    public record GetAppointmentByIdQuery(int Id) : IRequest<AppointmentDto>;

    public class GetAppointmentByIdQueryHandler
        : IRequestHandler<GetAppointmentByIdQuery, AppointmentDto>
    {
        private readonly IAppointmentRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetAppointmentByIdQueryHandler> _logger;

        public GetAppointmentByIdQueryHandler(
            IAppointmentRepository repository,
            IMapper mapper,
            ILogger<GetAppointmentByIdQueryHandler> logger
        )
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<AppointmentDto> Handle(
            GetAppointmentByIdQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation("Fetching appointment with Id: {Id}", request.Id);

            var appointment = await _repository.GetByIdAsync(request.Id);

            if (appointment == null)
            {
                _logger.LogWarning("Appointment not found. Id: {Id}", request.Id);
                throw new KeyNotFoundException($"Appointment with Id {request.Id} not found.");
            }

            _logger.LogInformation("Appointment found. Id: {Id}", request.Id);

            return _mapper.Map<AppointmentDto>(appointment);
        }
    }
}
