using System.Diagnostics.CodeAnalysis;
namespace IdentityService.Exceptions
{

    [ExcludeFromCodeCoverage]
    public class UserAlreadyExistsException : Exception
    {
        public UserAlreadyExistsException()
            : base("User already exists")
        {
        }
    }
}