 using System.Diagnostics.CodeAnalysis;
namespace IdentityService.Exceptions
{
    [ExcludeFromCodeCoverage]
    public class InvalidCredentialsException : Exception
    {
        public InvalidCredentialsException()
            : base("Invalid email or password")
        {
        }
    }
}