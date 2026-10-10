using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NotificationService.Application.DTOs;
using NotificationService.Application.Interfaces;

namespace NotificationService.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            IEmailService emailService,
            ILogger<NotificationController> logger
        )
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("email")]
        //[Authorize]
        public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
        {
            _logger.LogInformation(
                "Email send request received. To: {Recipient}, Subject: {Subject}",
                request?.To,
                request?.Subject
            );

            if (request == null)
            {
                _logger.LogWarning("Email request failed. Request body was null.");

                return BadRequest();
            }

            await _emailService.SendEmailAsync(request.To, request.Subject, request.Body);

            _logger.LogInformation("Email sent successfully. To: {Recipient}", request.To);

            return Ok(new { Message = "Email sent successfully" });
        }
    }
}
