using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.DTOs;
using PropertyService.Application.Features.Offers.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class CreateOfferCommandHandlerTests
    {
        private readonly Mock<IOfferRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<CreateOfferCommandHandler>> _loggerMock;

        private readonly CreateOfferCommandHandler _handler;

        public CreateOfferCommandHandlerTests()
        {
            _repositoryMock = new Mock<IOfferRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<CreateOfferCommandHandler>>();

            _handler = new CreateOfferCommandHandler(
                _repositoryMock.Object,
                _mapperMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldCreateOffer_WhenValid()
        {
            // Arrange
            var command = new CreateOfferCommand(1, 2, 50000);

            var status = new RefTerm { Id = 1, Key = "PENDING" };

            var offer = new Offer
            {
                Id = 10,
                PropertyId = 1,
                UserId = 2,
                OfferAmount = 50000,
                StatusId = 1,
            };

            var dto = new OfferDto { Id = 10 };

            _repositoryMock.Setup(r => r.GetStatusByKeyAsync("PENDING")).ReturnsAsync(status);

            _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Offer>())).ReturnsAsync(offer);

            _repositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            _mapperMock.Setup(m => m.Map<OfferDto>(offer)).Returns(dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
        }

        [Fact]
        public async Task Handle_ShouldThrowException_WhenPendingStatusMissing()
        {
            // Arrange
            var command = new CreateOfferCommand(1, 2, 50000);

            _repositoryMock
                .Setup(r => r.GetStatusByKeyAsync("PENDING"))
                .ReturnsAsync((RefTerm)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, CancellationToken.None)
            );
        }
    }
}
