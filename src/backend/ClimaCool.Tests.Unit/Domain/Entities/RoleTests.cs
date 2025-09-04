using ClimaCool.Domain.Entities;

namespace ClimaCool.Tests.Unit.Domain.Entities;

public class RoleTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithDefaults()
    {
        var role = new Role();
        
        role.Id.Should().NotBeEmpty();
        role.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        role.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        role.UserRoles.Should().NotBeNull();
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Customer")]
    [InlineData("Manager")]
    public void SetName_WithValidName_ShouldSetName(string name)
    {
        var role = new Role { Name = name };
        
        role.Name.Should().Be(name);
    }

    [Theory]
    [InlineData("Administrator role with full system access")]
    [InlineData("Customer role for regular users")]
    [InlineData("Manager role for business operations")]
    public void SetDescription_WithValidDescription_ShouldSetDescription(string description)
    {
        var role = new Role { Description = description };
        
        role.Description.Should().Be(description);
    }

    [Fact]
    public void AddUserRole_ShouldAddToUserRolesCollection()
    {
        var role = new Role();
        var user = new User { Email = "test@example.com" };
        var userRole = new UserRole { UserId = user.Id, RoleId = role.Id, User = user, Role = role };
        
        role.UserRoles.Add(userRole);
        
        role.UserRoles.Should().HaveCount(1);
        role.UserRoles.First().Should().Be(userRole);
    }
}