using IdentityService;
using IdentityService.Helpers;

namespace IdentityService.IntegrationTests
{
    public class FakePropertyApi : IPropertyApi
    {
        public Task SyncUser(int userId, SyncUserPayload payload)
        {
            return Task.CompletedTask;
        }

        public Task DeleteUser(int userId)
        {
            return Task.CompletedTask;
        }
    }
}
