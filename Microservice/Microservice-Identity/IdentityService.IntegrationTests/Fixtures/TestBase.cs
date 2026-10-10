using IdentityService.IntegrationTests.Fixtures;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace IdentityService.IntegrationTests.Fixtures
{
    public class TestBase : IClassFixture<IdentityServiceFactory>
    {
        protected readonly HttpClient Client;
        protected readonly IdentityServiceFactory Factory;

        public TestBase(IdentityServiceFactory factory)
        {
            Factory = factory;
            Client = factory.CreateClient();
            Client.DefaultRequestHeaders.Add("Authorization", "Test");
        }
    }
}
