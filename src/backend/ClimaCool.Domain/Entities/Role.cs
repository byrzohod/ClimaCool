namespace ClimaCool.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    
    // Predefined roles
    public const string Customer = "Customer";
    public const string Admin = "Admin";
    public const string Vendor = "Vendor";
}