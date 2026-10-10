using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.Properties.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class MarkPropertyAsSoldCommandHandlerTests
    {
        private readonly Mock<IPropertyRepository> _repositoryMock;
        private readonly Mock<ILogger<MarkPropertyAsSoldCommandHandler>> _loggerMock;

        private readonly MarkPropertyAsSoldCommandHandler _handler;

        public MarkPropertyAsSoldCommandHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyRepository>();
            _loggerMock = new Mock<ILogger<MarkPropertyAsSoldCommandHandler>>();

            _handler = new MarkPropertyAsSoldCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldMarkAsSold_WhenValid()
        {
            // Arrange
            var property = new Property { Id = 1, StatusId = 1 };

            var soldStatus = new RefTerm { Id = 2, Key = "SOLD" };

            _repositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(property);

            _repositoryMock.Setup(r => r.GetStatusByKeyAsync("SOLD")).ReturnsAsync(soldStatus);

            // 🔴 FIXED — UpdateAsync returns Property
            _repositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Property>())).ReturnsAsync(property);

            _repositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var command = new MarkPropertyAsSoldCommand(1);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
        }
    }
}
