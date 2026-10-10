using System;
using PropertyService.Domain.Common;

namespace PropertyService.Domain.Entities
{
    public class User : BaseEntity
    {
        public int Id { get; set; }

        public int RoleId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public RefTerm Role { get; set; }
    }
}
