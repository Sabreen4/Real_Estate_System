using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.PropertyImages.Command;
using PropertyService.Application.Interfaces;
using Xunit;

namespace PropertyService.Tests
{
    public class DeletePropertyImagesCommandHandlerTests
    {
        private readonly Mock<IPropertyImageRepository> _repositoryMock;
        private readonly Mock<ILogger<DeletePropertyImagesCommandHandler>> _loggerMock;

        private readonly DeletePropertyImagesCommandHandler _handler;

        public DeletePropertyImagesCommandHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyImageRepository>();
            _loggerMock = new Mock<ILogger<DeletePropertyImagesCommandHandler>>();

            _handler = new DeletePropertyImagesCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldDeleteImages_WhenIdsProvided()
        {
            // Arrange
            var ids = new List<int> { 1, 2, 3 };

            _repositoryMock
                .Setup(r => r.DeleteByIdsAsync(ids))
                .Returns(Task.CompletedTask);

            var command =
                new DeletePropertyImagesCommand(ids);

            // Act
            var result =
                await _handler.Handle(
                    command,
                    CancellationToken.None
                );

            // Assert
            Assert.Equal(Unit.Value, result);

            _repositoryMock.Verify(
                r => r.DeleteByIdsAsync(ids),
                Times.Once
            );
        }
    }
}