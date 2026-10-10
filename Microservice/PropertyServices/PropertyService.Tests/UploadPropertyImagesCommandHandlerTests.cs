using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.PropertyImages.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class UploadPropertyImagesCommandHandlerTests
    {
        private readonly Mock<IPropertyImageRepository> _repositoryMock;
        private readonly Mock<ILogger<UploadPropertyImagesCommandHandler>> _loggerMock;

        private readonly UploadPropertyImagesCommandHandler _handler;

        public UploadPropertyImagesCommandHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyImageRepository>();
            _loggerMock = new Mock<ILogger<UploadPropertyImagesCommandHandler>>();

            _handler = new UploadPropertyImagesCommandHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldUploadImages_WhenValid()
        {
            // Arrange
            var files = new List<byte[]>
            {
                new byte[] { 1, 2, 3 }
            };

            var contentTypes = new List<string>
            {
                "image/jpeg"
            };

            _repositoryMock
                .Setup(r => r.PropertyExistsAsync(1))
                .ReturnsAsync(true);

            _repositoryMock
                .Setup(r => r.AddRangeAsync(It.IsAny<List<PropertyImage>>()))
                .Returns(Task.CompletedTask);

            _repositoryMock
                .Setup(r => r.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var command =
                new UploadPropertyImagesCommand(
                    1,
                    files,
                    contentTypes
                );

            // Act
            var result =
                await _handler.Handle(
                    command,
                    CancellationToken.None
                );

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenCountsMismatch()
        {
            // Arrange
            var files = new List<byte[]>
            {
                new byte[] { 1 }
            };

            var contentTypes = new List<string>();

            var command =
                new UploadPropertyImagesCommand(
                    1,
                    files,
                    contentTypes
                );

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(
                    command,
                    CancellationToken.None
                )
            );
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenPropertyNotFound()
        {
            // Arrange
            var files = new List<byte[]>
            {
                new byte[] { 1 }
            };

            var contentTypes = new List<string>
            {
                "image/jpeg"
            };

            _repositoryMock
                .Setup(r => r.PropertyExistsAsync(1))
                .ReturnsAsync(false);

            var command =
                new UploadPropertyImagesCommand(
                    1,
                    files,
                    contentTypes
                );

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(
                    command,
                    CancellationToken.None
                )
            );
        }
    }
}