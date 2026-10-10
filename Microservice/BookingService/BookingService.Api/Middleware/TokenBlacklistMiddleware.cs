using BookingService.Api.Middleware;

namespace BookingService.Api.Middleware
{
    public class TokenBlacklistMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenBlacklistMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();

            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Replace("Bearer ", "");

                if (TokenBlacklist.Contains(token))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Token revoked");
                    return;
                }
            }

            await _next(context);
        }
    }
}
