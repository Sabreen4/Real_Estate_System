using System.Net;
using System.Text.Json;
using PropertyService.Application.DTOs;
using PropertyService.Application.Exceptions;

namespace PropertyService.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, IHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ConflictException ex)
        {
            await WriteError(context, HttpStatusCode.Conflict, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteError(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (ArgumentException ex)
        {
            await WriteError(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (AuthenticationException ex)
        {
            await WriteError(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteError(context, HttpStatusCode.Forbidden, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            // MediatR DI / construction failures — not a business logic conflict
            var msg = _env.IsDevelopment() ? ex.ToString() : "An internal error occurred.";
            await WriteError(context, HttpStatusCode.InternalServerError, msg);
        }
        catch (Exception ex)
        {
            var msg = _env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred.";
            await WriteError(context, HttpStatusCode.InternalServerError, msg);
        }
    }

    private static async Task WriteError(HttpContext ctx, HttpStatusCode code, string message)
    {
        ctx.Response.StatusCode = (int)code;
        ctx.Response.ContentType = "application/json";

        var error = new ErrorResponseDto { Message = message, StatusCode = (int)code };

        await ctx.Response.WriteAsync(JsonSerializer.Serialize(error));
    }
}
