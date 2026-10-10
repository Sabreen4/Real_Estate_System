using BookingService.Application.DTOs;
using BookingService.Application.Features.Transactions.Commands;
using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BookingService.Tests.Features.Transactions.Commands
{
    public class CreateTransactionCommandHandlerTests
    {
        private readonly Mock<ITransactionRepository> _repositoryMock;
        private readonly Mock<ILogger<CreateTransactionCommandHandler>> _loggerMock;
        private readonly CreateTransactionCommandHandler _handler;

        public CreateTransactionCommandHandlerTests()
        {
            _repositoryMock = new Mock<ITransactionRepository>();
            _loggerMock = new Mock<ILogger<CreateTransactionCommandHandler>>();

            _handler = new CreateTransactionCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldCreateTransaction_WhenValid()
        {
            // Arrange
            var command = new CreateTransactionCommand(
                PropertyId: 1,
                BuyerId: 2,
                SellerId: 3,
                Amount: 1000
            );

            var status = new RefTerm { Id = 1, Key = "PENDING" };

            var transaction = new Transaction
            {
                Id = 10,
                PropertyId = 1,
                BuyerId = 2,
                SellerId = 3,
                Amount = 1000,
                StatusId = 1,
            };

            _repositoryMock.Setup(r => r.GetStatusByKeyAsync("PENDING")).ReturnsAsync(status);

            _repositoryMock
                .Setup(r => r.AddAsync(It.IsAny<Transaction>()))
                .ReturnsAsync(transaction);

            _repositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
            Assert.Equal("PENDING", result.Status);
        }

        [Fact]
        public async Task Handle_ShouldThrowArgumentException_WhenAmountInvalid()
        {
            var command = new CreateTransactionCommand(1, 2, 3, 0);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, CancellationToken.None)
            );
        }

        [Fact]
        public async Task Handle_ShouldThrowException_WhenBuyerSellerSame()
        {
            var command = new CreateTransactionCommand(1, 2, 2, 100);

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, CancellationToken.None)
            );
        }
    }
}
