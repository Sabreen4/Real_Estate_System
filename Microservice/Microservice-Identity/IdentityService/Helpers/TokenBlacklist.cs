using System.Collections.Generic;

namespace IdentityService.Helpers
{
    public static class TokenBlacklist
    {
        private static readonly HashSet<string> _blacklist = new();

        public static void Add(string token)
        {
            if (!string.IsNullOrWhiteSpace(token))
            {
                _blacklist.Add(token);
            }
        }

        public static bool Contains(string token)
        {
            return _blacklist.Contains(token);
        }
    }
}