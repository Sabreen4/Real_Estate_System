using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Features.Appointments.Queries;
using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BookingService.Tests.Features.Appointments.Queries
{
    public class GetAppointmentByIdQueryHandlerTests
    {
        private readonly Mock<IAppointmentRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<GetAppointmentByIdQueryHandler>> _loggerMock;

        private readonly GetAppointmentByIdQueryHandler _handler;

        public GetAppointmentByIdQueryHandlerTests()
        {
            _repositoryMock = new Mock<IAppointmentRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<GetAppointmentByIdQueryHandler>>();

            _handler = new GetAppointmentByIdQueryHandler(
                _repositoryMock.Object,
                _mapperMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldReturnAppointmentDto_WhenAppointmentExists()
        {
            // Arrange
            var appointmentId = 1;

            var appointment = new Appointment { Id = appointmentId };

            var appointmentDto = new AppointmentDto { Id = appointmentId };

            _repositoryMock.Setup(r => r.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);

            _mapperMock.Setup(m => m.Map<AppointmentDto>(appointment)).Returns(appointmentDto);

            var query = new GetAppointmentByIdQuery(appointmentId);

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.Id);

            _repositoryMock.Verify(r => r.GetByIdAsync(appointmentId), Times.Once);

            _mapperMock.Verify(m => m.Map<AppointmentDto>(appointment), Times.Once);
        }

        [Fact]
        public async Task Handle_ShouldThrowException_WhenAppointmentNotFound()
        {
            // Arrange
            var appointmentId = 1;

            _repositoryMock
                .Setup(r => r.GetByIdAsync(appointmentId))
                .ReturnsAsync((Appointment)null);

            var query = new GetAppointmentByIdQuery(appointmentId);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(query, CancellationToken.None)
            );

            _repositoryMock.Verify(r => r.GetByIdAsync(appointmentId), Times.Once);
        }
    }
}
