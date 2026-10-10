using IdentityService.Helpers;

namespace IdentityService.Middleware
{
    public class TokenBlacklistMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenBlacklistMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var token = context
                .Request.Headers["Authorization"]
                .FirstOrDefault()
                ?.Split(" ")
                .Last();

            if (!string.IsNullOrEmpty(token))
            {
                if (TokenBlacklist.Contains(token))
                {
                    context.Response.StatusCode = 401;

                    await context.Response.WriteAsync("Token has been revoked.");

                    return;
                }
            }

            await _next(context);
        }
    }
}
