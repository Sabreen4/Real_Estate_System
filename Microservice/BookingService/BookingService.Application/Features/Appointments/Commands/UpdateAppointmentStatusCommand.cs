using System.Net;
using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Appointments.Commands
{
    public record UpdateAppointmentStatusCommand(int Id, string Status, string token)
        : IRequest<Unit>;

    public class UpdateAppointmentStatusCommandHandler
        : IRequestHandler<UpdateAppointmentStatusCommand, Unit>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly INotificationServiceClient _notificationClient;
        private readonly IPropertyApi _propertyApi;
        private readonly ILogger<UpdateAppointmentStatusCommandHandler> _logger;

        public UpdateAppointmentStatusCommandHandler(
            IAppointmentRepository appointmentRepository,
            IPropertyApi propertyApi,
            INotificationServiceClient notificationClient,
            ILogger<UpdateAppointmentStatusCommandHandler> logger
        )
        {
            _appointmentRepository = appointmentRepository;
            _propertyApi = propertyApi;
            _notificationClient = notificationClient;
            _logger = logger;
        }

        public async Task<Unit> Handle(
            UpdateAppointmentStatusCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Updating appointment status. AppointmentId: {Id}, NewStatus: {Status}",
                request.Id,
                request.Status
            );

            // Get appointment
            var appointment = await _appointmentRepository.GetByIdAsync(request.Id);

            if (appointment == null)
                throw new Exception("Appointment not found");

            // Get status
            var status = await _appointmentRepository.GetStatusByKeyAsync(request.Status.ToLower());

            if (status == null)
                throw new Exception("Invalid status");

            // Update status
            appointment.StatusId = status.Id;

            await _appointmentRepository.UpdateAsync(appointment);

            _logger.LogInformation(
                "Appointment updated. Id: {Id}, StatusId: {StatusId}",
                appointment.Id,
                status.Id
            );

            // Send email only for final statuses
            if (status.Key.ToUpper() == "APPROVED" || status.Key.ToUpper() == "REJECTED")
            {
                try
                {
                    // GET USER FROM PROPERTY SERVICE (NOT DB)
                    var user = await _propertyApi.GetUserByIdAsync(appointment.UserId);

                    if (user == null)
                        throw new Exception("User not found in PropertyService");

                    // Decide color based on status
                    var statusColor =
                        status.Key.ToUpper() == "APPROVED" ? "green"
                        : status.Key.ToUpper() == "REJECTED" ? "red"
                        : "black";

                    // Build email request
                    var emailRequest = new SendEmailRequest
                    {
                        To = user.Email,
                        Subject = $"Appointment {status.Key}",

                        Body =
                          $@"
<html>
    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;'>

        <h2 style='color:#2c3e50;'>
            Appointment Status Update
        </h2>

        <p>
            Hi <strong>{user.FirstName}</strong>,
        </p>

        <p>
            We wanted to let you know that your appointment has been reviewed and the status has been updated.
        </p>

        <p>
            Your appointment <strong>#{appointment.Id}</strong> 
           
        </p>

        <p style='font-size:18px; color:{statusColor};'>
            <strong>{status.Key}</strong>
        </p>

        {(status.Key == "APPROVED" ? $@"
        <p style='color:#27ae60;'>
            Your appointment has been confirmed. Please make sure to be available at the scheduled time.
            Our agent will be in touch with you shortly.
        </p>" : status.Key == "REJECTED" ? $@"
        <p style='color:#e74c3c;'>
            Unfortunately, your appointment has been cancelled. You are welcome to book a new appointment
            at your convenience by logging into your account.
        </p>" : $@"
        <p style='color:#f39c12;'>
            Your appointment is currently under review. We will notify you once a decision has been made.
        </p>")}

        <br/>

        <p>
            To view your appointment details or book a new one, please visit your account:
        </p>

        <p>
            <a href='http://localhost:4200/login' 
               style='display:inline-block; padding:10px 20px; background-color:#2c3e50; 
                      color:#ffffff; text-decoration:none; border-radius:5px; font-size:14px;'>
                View My Account
            </a>
        </p>

        <br/>

        <p style='font-size:12px; color:#888;'>
            If you did not expect this email or have any questions, please contact our support team.
        </p>

        <p>
            Thank you,<br/>
            <strong>Booking Service Team</strong>
        </p>

    </body>
</html>"
                    };
                    _logger.LogInformation("Sending email now...");

                    await _notificationClient.SendEmailAsync(emailRequest, request.token);

                    _logger.LogInformation("Email sent to {Email}", user.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Email sending failed");
                }
            }

            return Unit.Value;
        }
    }
}
