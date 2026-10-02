using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LMS.API.Data;
using LMS.API.Models;
using System.Security.Claims;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("coordinators")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCoordinators([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Users.Where(u => u.Role == "Coordinator").AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        var total = await q.CountAsync();
        var items = await q.OrderBy(u => u.Name).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new {
                u.Id, u.Name, u.Email, u.Phone, u.IsActive,
                groupsCount = _db.CoordinatorGroups.Count(cg => cg.CoordinatorId == u.Id)
            }).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpPost("coordinators")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCoordinator([FromBody] CreateUserRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Email already exists" });
        _db.Users.Add(new User {
            Name = req.Name, Email = req.Email, Role = "Coordinator",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Phone = req.Phone, IsActive = true
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Coordinator created" });
    }

    [HttpGet("coordinators/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCoordinator(int id)
    {
        var user = await _db.Users.Where(u => u.Id == id && u.Role == "Coordinator")
            .Select(u => new {
                u.Id, u.Name, u.Email, u.Phone, u.IsActive,
                groupsCount = _db.CoordinatorGroups.Count(cg => cg.CoordinatorId == u.Id),
                groups = _db.CoordinatorGroups.Where(cg => cg.CoordinatorId == u.Id)
                    .Select(cg => new { cg.Group.Id, cg.Group.Name, cg.Group.Code })
            }).FirstOrDefaultAsync();
        if (user == null) return NotFound(new { message = "Coordinator not found" });
        return Ok(user);
    }

    [HttpPut("coordinators/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCoordinator(int id, [FromBody] UpdateCoordinatorRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Coordinator");
        if (user == null) return NotFound(new { message = "Coordinator not found" });
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Name is required" });
        if (!string.IsNullOrEmpty(req.Email) && req.Email != user.Email)
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email && u.Id != id))
                return BadRequest(new { message = "Email already in use" });
            user.Email = req.Email;
        }
        user.Name = req.Name;
        user.Phone = req.Phone;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Coordinator updated" });
    }

    [HttpPost("coordinators/{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetCoordinatorPassword(int id, [FromBody] ResetPasswordRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Coordinator");
        if (user == null) return NotFound(new { message = "Coordinator not found" });
        if (string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest(new { message = "Password is required" });
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password reset successfully" });
    }

    [HttpDelete("coordinators/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCoordinator(int id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Coordinator");
        if (user == null) return NotFound(new { message = "Coordinator not found" });
        var hasGroups = await _db.CoordinatorGroups.AnyAsync(cg => cg.CoordinatorId == id);
        if (hasGroups)
            return BadRequest(new { message = "This coordinator is assigned to groups. Remove them from all groups first, or deactivate instead." });
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Coordinator deleted" });
    }


    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Status updated", isActive = user.IsActive });
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return NotFound();
        return Ok(new { user.Id, user.Name, user.Email, user.Role, user.Phone, user.IsActive });
    }
}

public record CreateUserRequest(string Name, string Email, string Password, string? Phone);

public record UpdateCoordinatorRequest(string Name, string? Email, string? Phone);
public record ResetPasswordRequest(string NewPassword);
