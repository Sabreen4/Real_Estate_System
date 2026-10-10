// GetBookedSlotsQuery.cs
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Appointments.Queries
{
    public record GetBookedSlotsQuery(int PropertyId, string Token) : IRequest<List<string>>;

    public class GetBookedSlotsQueryHandler : IRequestHandler<GetBookedSlotsQuery, List<string>>
    {
        private readonly IAppointmentRepository _repository;
        private readonly IPropertyApi _propertyApi;
        private readonly ILogger<GetBookedSlotsQueryHandler> _logger;

        public GetBookedSlotsQueryHandler(
            IAppointmentRepository repository,
            IPropertyApi propertyApi,
            ILogger<GetBookedSlotsQueryHandler> logger
        )
        {
            _repository = repository;
            _propertyApi = propertyApi;
            _logger = logger;
        }

        public async Task<List<string>> Handle(
            GetBookedSlotsQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Fetching booked slots for PropertyId: {PropertyId}",
                request.PropertyId
            );

            var property = await _propertyApi.GetPropertyByIdAsync(
                request.PropertyId,
                request.Token
            );

            if (property == null)
                throw new Exception("Property not found");

            var slots = await _repository.GetBookedVisitDatesAsync(
                request.PropertyId,
                property.AgentId
            );

            _logger.LogInformation(
                "Found {Count} booked slots for AgentId: {AgentId}",
                slots.Count,
                property.AgentId
            );

            return slots;
        }
    }
}
