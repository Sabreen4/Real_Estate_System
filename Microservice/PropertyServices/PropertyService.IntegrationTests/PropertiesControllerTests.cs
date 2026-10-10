using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using PropertyService.Application.DTOs;
using Xunit;

namespace PropertyService.IntegrationTests;

public class PropertiesControllerTests : IClassFixture<IntegrationTestFixture>
{
    private readonly HttpClient _client;

    public PropertiesControllerTests(IntegrationTestFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task GetAll_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/properties");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenInvalidId()
    {
        var response = await _client.GetAsync("/api/properties/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateProperty_ShouldReturnCreated()
    {
        //  IMPORTANT: correct role for this endpoint
        _client.DefaultRequestHeaders.Remove("Test-Role");
        _client.DefaultRequestHeaders.Add("Test-Role", "AGENT");

        var request = new CreatePropertyRequestDto
        {
            Title = "Villa",
            Description = "Luxury house",
            City = "Chennai",
            State = "TN",
            ZipCode = "600001",
            Price = 500000,
            Size = 2000,
            PropertyTypeId = 1,
            ListingTypeId = 1,
            StatusId = 1,
        };

        var response = await _client.PostAsJsonAsync("/api/properties", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
