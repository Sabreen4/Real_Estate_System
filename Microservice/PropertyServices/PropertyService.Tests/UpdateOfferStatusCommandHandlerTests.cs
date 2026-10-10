using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.Offers.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class UpdateOfferStatusCommandHandlerTests
    {
        private readonly Mock<IOfferRepository> _repositoryMock;
        private readonly Mock<ILogger<UpdateOfferStatusCommandHandler>> _loggerMock;

        private readonly UpdateOfferStatusCommandHandler _handler;

        public UpdateOfferStatusCommandHandlerTests()
        {
            _repositoryMock = new Mock<IOfferRepository>();
            _loggerMock = new Mock<ILogger<UpdateOfferStatusCommandHandler>>();

            _handler = new UpdateOfferStatusCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldUpdateStatus_WhenValid()
        {
            // Arrange
            var offer = new Offer
            {
                Id = 1,
                StatusId = 1
            };

            var status = new RefTerm
            {
                Id = 2,
                Key = "APPROVED"
            };

            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(offer);

            _repositoryMock
                .Setup(r => r.GetStatusByKeyAsync("APPROVED"))
                .ReturnsAsync(status);

            _repositoryMock
                .Setup(r => r.UpdateAsync(offer))
                .Returns(Task.CompletedTask);

            var command =
                new UpdateOfferStatusCommand(
                    1,
                    "APPROVED"
                );

            // Act
            var result = await _handler.Handle(
                command,
                CancellationToken.None
            );

            // Assert
            Assert.Equal(Unit.Value, result);
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenOfferNotFound()
        {
            // Arrange
            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync((Offer)null);

            var command =
                new UpdateOfferStatusCommand(
                    1,
                    "APPROVED"
                );

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(
                    command,
                    CancellationToken.None
                )
            );
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenInvalidStatus()
        {
            // Arrange
            var offer = new Offer
            {
                Id = 1
            };

            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(offer);

            _repositoryMock
                .Setup(r => r.GetStatusByKeyAsync("INVALID"))
                .ReturnsAsync((RefTerm)null);

            var command =
                new UpdateOfferStatusCommand(
                    1,
                    "INVALID"
                );

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(
                    command,
                    CancellationToken.None
                )
            );
        }
    }
}