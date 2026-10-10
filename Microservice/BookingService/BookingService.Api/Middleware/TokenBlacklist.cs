using System.Collections.Concurrent;
namespace BookingService.Api.Middleware
{
    public static class TokenBlacklist
    {
        private static readonly ConcurrentDictionary<string, bool> _blacklist = new();

        public static void Add(string token)
        {
            _blacklist[token] = true;
        }

        public static bool Contains(string token)
        {
            return _blacklist.ContainsKey(token);
        }
    }
}
