using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.DTOs;
using PropertyService.Application.Features.Properties.Command;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class CreatePropertyCommandHandlerTests
    {
        private readonly Mock<IPropertyRepository> _repositoryMock;
        private readonly Mock<ILogger<CreatePropertyCommandHandler>> _loggerMock;

        private readonly CreatePropertyCommandHandler _handler;

        public CreatePropertyCommandHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyRepository>();
            _loggerMock = new Mock<ILogger<CreatePropertyCommandHandler>>();

            _handler = new CreatePropertyCommandHandler(_repositoryMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task Handle_ShouldCreateProperty_WhenValid()
        {
            // Arrange
            var dto = new CreatePropertyRequestDto
            {
                Title = "Test Property",
                Description = "Nice house",
                City = "Chennai",
                State = "TN",
                ZipCode = "600001",
                Price = 500000,
                Size = 1200,
                PropertyTypeId = 1,
                ListingTypeId = 1,
                StatusId = 1,
            };

            var property = new Property
            {
                Id = 10,
                UserId = 1,
                Title = dto.Title,
                Description = dto.Description,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                Price = dto.Price,
                Size = dto.Size,
                PropertyTypeId = dto.PropertyTypeId,
                ListingTypeId = dto.ListingTypeId,
                StatusId = dto.StatusId,
            };

            _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Property>())).ReturnsAsync(property);

            _repositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var command = new CreatePropertyCommand(1, dto);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
        }
    }
}
