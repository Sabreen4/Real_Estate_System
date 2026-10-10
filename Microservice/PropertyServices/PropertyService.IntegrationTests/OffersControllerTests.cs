using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using PropertyService.Application.DTOs;
using Xunit;

namespace PropertyService.IntegrationTests;

public class OffersControllerTests : IClassFixture<IntegrationTestFixture>
{
    private readonly HttpClient _client;

    public OffersControllerTests(IntegrationTestFixture fixture)
    {
        _client = fixture.Client;
    }

    [Fact]
    public async Task CreateOffer_ShouldReturnOk()
    {
        // 🔥 IMPORTANT: set correct role
        _client.DefaultRequestHeaders.Remove("Test-Role");
        _client.DefaultRequestHeaders.Add("Test-Role", "BUYER");

        var request = new CreateOfferRequest { OfferAmount = 5000 };

        var response = await _client.PostAsJsonAsync("/api/properties/1/offers", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
