using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.Features.Properties.Query;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class GetPropertyByIdQueryHandlerTests
    {
        private readonly Mock<IPropertyRepository> _repositoryMock;
        private readonly Mock<ILogger<GetPropertyByIdQueryHandler>> _loggerMock;

        private readonly GetPropertyByIdQueryHandler _handler;

        public GetPropertyByIdQueryHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyRepository>();
            _loggerMock = new Mock<ILogger<GetPropertyByIdQueryHandler>>();

            _handler = new GetPropertyByIdQueryHandler(
                _repositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldReturnProperty_WhenExists()
        {
            var property = new Property
            {
                Id = 1,
                UserId = 1,
                Title = "Test"
            };

            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(property);

            var result =
                await _handler.Handle(
                    new GetPropertyByIdQuery(1),
                    CancellationToken.None
                );

            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
        }

        [Fact]
        public async Task Handle_ShouldReturnNull_WhenNotFound()
        {
            _repositoryMock
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync((Property)null);

            var result =
                await _handler.Handle(
                    new GetPropertyByIdQuery(1),
                    CancellationToken.None
                );

            Assert.Null(result);
        }
    }
}