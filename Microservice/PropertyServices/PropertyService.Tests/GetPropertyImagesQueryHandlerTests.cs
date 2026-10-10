using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using PropertyService.Application.DTOs;
using PropertyService.Application.Features.PropertyImages.Query;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using Xunit;

namespace PropertyService.Tests
{
    public class GetPropertyImagesQueryHandlerTests
    {
        private readonly Mock<IPropertyImageRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<GetPropertyImagesQueryHandler>> _loggerMock;

        private readonly GetPropertyImagesQueryHandler _handler;

        public GetPropertyImagesQueryHandlerTests()
        {
            _repositoryMock = new Mock<IPropertyImageRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<GetPropertyImagesQueryHandler>>();

            _handler = new GetPropertyImagesQueryHandler(
                _repositoryMock.Object,
                _mapperMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task Handle_ShouldReturnImages_WhenExist()
        {
            // Arrange
            var images = new List<PropertyImage>
            {
                new PropertyImage
                {
                    Id = 1,
                    PropertyId = 1
                }
            };

            var dtos = new List<PropertyImageDto>
            {
                new PropertyImageDto
                {
                    Id = 1
                }
            };

            _repositoryMock
                .Setup(r => r.GetByPropertyIdAsync(1))
                .ReturnsAsync(images);

            _mapperMock
                .Setup(m => m.Map<List<PropertyImageDto>>(images))
                .Returns(dtos);

            var query =
                new GetPropertyImagesQuery(1);

            // Act
            var result =
                await _handler.Handle(
                    query,
                    CancellationToken.None
                );

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
        }
    }
}