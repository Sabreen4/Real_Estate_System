using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Appointments.Queries;

// Token is passed so BookingService can call PropertyService with auth
public record GetAgentAppointmentsQuery(int AgentId, string Token) : IRequest<List<AppointmentDto>>;

public class GetAgentAppointmentsQueryHandler
    : IRequestHandler<GetAgentAppointmentsQuery, List<AppointmentDto>>
{
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IPropertyServiceClient _propertyClient;
    private readonly IMapper _mapper;
    private readonly ILogger<GetAgentAppointmentsQueryHandler> _logger;

    public GetAgentAppointmentsQueryHandler(
        IAppointmentRepository appointmentRepo,
        IPropertyServiceClient propertyClient,
        IMapper mapper,
        ILogger<GetAgentAppointmentsQueryHandler> logger
    )
    {
        _appointmentRepo = appointmentRepo;
        _propertyClient = propertyClient;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<AppointmentDto>> Handle(
        GetAgentAppointmentsQuery request,
        CancellationToken cancellationToken
    )
    {
        _logger.LogInformation("Fetching appointments for AgentId: {AgentId}", request.AgentId);

        // Call PropertyService with the agent's JWT

        var paginatedProperties = await _propertyClient.GetPropertiesByAgentAsync(
            request.AgentId,
            request.Token
        );

        var propertyIds = paginatedProperties?.Items?.Select(p => p.Id).ToList() ?? new List<int>();

        _logger.LogInformation(
            "Agent {AgentId} owns {Count} properties: [{Ids}]",
            request.AgentId,
            propertyIds.Count,
            string.Join(",", propertyIds)
        );

        if (!propertyIds.Any())
            return new List<AppointmentDto>();

        // Fetch appointments where PropertyId is in agent's property list
        var appointments = await _appointmentRepo.GetByAgentPropertyIdsAsync(
            propertyIds,
            cancellationToken
        );

        _logger.LogInformation(
            "Found {Count} appointments for AgentId: {AgentId}",
            appointments.Count,
            request.AgentId
        );

        return _mapper.Map<List<AppointmentDto>>(appointments);
    }
}
