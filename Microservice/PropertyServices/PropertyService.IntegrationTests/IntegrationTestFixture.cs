using System.Net.Http;

namespace PropertyService.IntegrationTests;

public class IntegrationTestFixture
{
    public HttpClient Client { get; }

    public IntegrationTestFixture()
    {
        var factory = new CustomWebApplicationFactory<Program>();
        Client = factory.CreateClient();
    }
}