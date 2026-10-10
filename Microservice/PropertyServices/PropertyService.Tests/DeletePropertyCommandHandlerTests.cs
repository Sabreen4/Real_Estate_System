using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.Properties.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class DeletePropertyCommandHandlerTests
    {
        private readonly Mock<IPropertyRepository> _repositoryMock;
        private readonly Mock<ILogger<DeletePropertyCommandHandler>> _loggerMock;

        private readonly DeletePropertyCommandHandler _handler;

        public DeletePropertyCommandHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyRepository>();
            _loggerMock = new Mock<ILogger<DeletePropertyCommandHandler>>();

            _handler = new DeletePropertyCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldReturnTrue_WhenDeleted()
        {
            var property = new Property
            {
                Id = 1,
                UserId = 1
            };

            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(property);

            _repositoryMock
                .Setup(r => r.DeleteAsync(property))
                .Returns(Task.CompletedTask);

            var command =
                new DeletePropertyCommand(
                    1,
                    1,
                    false
                );

            var result =
                await _handler.Handle(
                    command,
                    CancellationToken.None
                );

            Assert.True(result);
        }

        [Fact]
        public async Task Handle_ShouldReturnFalse_WhenPropertyNotFound()
        {
            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync((Property)null);

            var command =
                new DeletePropertyCommand(
                    1,
                    1,
                    false
                );

            var result =
                await _handler.Handle(
                    command,
                    CancellationToken.None
                );

            Assert.False(result);
        }
    }
}