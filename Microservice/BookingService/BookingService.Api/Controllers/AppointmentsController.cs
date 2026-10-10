// AppointmentsController.cs
using System.Security.Claims;
using BookingService.Application.DTOs;
using BookingService.Application.Features.Appointments.Commands;
using BookingService.Application.Features.Appointments.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingService.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<AppointmentsController> _logger;

        public AppointmentsController(IMediator mediator, ILogger<AppointmentsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        [Authorize(Roles = "BUYER")]
        [HttpPost("properties/{propertyId}/appointments")]
        public async Task<IActionResult> Create(
            int propertyId,
            [FromBody] CreateAppointmentRequest request
        )
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var token = Request.Headers["Authorization"].ToString(); // ← add this

            _logger.LogInformation(
                "Create appointment request received. PropertyId: {PropertyId}, UserId: {UserId}, VisitDate: {VisitDate}",
                propertyId,
                userId,
                request.VisitDate
            );

            var result = await _mediator.Send(
                new CreateAppointmentCommand(propertyId, userId, request.VisitDate, token)
            ); // ← pass token

            _logger.LogInformation(
                "Appointment created successfully. PropertyId: {PropertyId}, UserId: {UserId}",
                propertyId,
                userId
            );

            return Ok(result);
        }

        [Authorize(Roles = "AGENT")]
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAgentAppointments(CancellationToken cancellationToken)
        {
            var agentId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var token = Request.Headers["Authorization"].ToString();

            _logger.LogInformation("Agent {AgentId} requested their appointments.", agentId);

            var result = await _mediator.Send(
                new GetAgentAppointmentsQuery(agentId, token),
                cancellationToken
            );

            return Ok(result);
        }

        [Authorize(Roles = "BUYER")]
        [HttpGet("properties/{propertyId}/booked-slots")]
        public async Task<IActionResult> GetBookedSlots(
            int propertyId,
            CancellationToken cancellationToken
        )
        {
            var token = Request.Headers["Authorization"].ToString(); // ← add this

            _logger.LogInformation(
                "Get booked slots request received. PropertyId: {PropertyId}",
                propertyId
            );

            var result = await _mediator.Send(
                new GetBookedSlotsQuery(propertyId, token),
                cancellationToken
            ); // ← pass token

            return Ok(result);
        }

        [Authorize(Roles = "AGENT")]
        [HttpPut("appointments/{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateStatusRequest request
        )
        {
            _logger.LogInformation(
                "Update appointment status request received. AppointmentId: {AppointmentId}, Status: {Status}",
                id,
                request.Status
            );

            var token = HttpContext.Request.Headers["Authorization"].ToString();

            await _mediator.Send(new UpdateAppointmentStatusCommand(id, request.Status, token));

            _logger.LogInformation(
                "Appointment status updated successfully. AppointmentId: {AppointmentId}",
                id
            );

            return Ok();
        }
    }
}
