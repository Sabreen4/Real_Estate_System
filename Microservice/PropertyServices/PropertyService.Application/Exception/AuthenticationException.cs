// // Application/Exceptions/AuthenticationException.cs
// namespace PropertyManagementService.API.Application.Exceptions;

// public class AuthenticationException : Exception
// {
//     public AuthenticationException(string message) : base(message) { }
// }
namespace PropertyService.Application.Exceptions;

/// <summary>Login / credential failure → HTTP 401</summary>
public class AuthenticationException : Exception
{
    public AuthenticationException(string message) : base(message) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
