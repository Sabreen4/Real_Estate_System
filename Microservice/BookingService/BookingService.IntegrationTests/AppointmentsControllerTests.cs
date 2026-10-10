using System.Net;
using System.Net.Http.Json;
using BookingService.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace BookingService.IntegrationTests
{
    public class AppointmentsControllerTests
    {
        private readonly HttpClient _client;

        public AppointmentsControllerTests()
        {
            var factory = new CustomWebApplicationFactory();
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task CreateAppointment_ShouldReturnOk()
        {
            var request = new CreateAppointmentRequest { VisitDate = DateTime.UtcNow.AddDays(1) };

            var response = await _client.PostAsJsonAsync("/api/properties/1/appointments", request);

            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine("STATUS: " + response.StatusCode);
            Console.WriteLine("BODY: " + body);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
