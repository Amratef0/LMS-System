using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LMS.API.Data;
using LMS.API.Models;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InstructorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public InstructorsController(AppDbContext db) => _db = db;

    // Admin and Coordinator can both view the instructor list (needed for the session form dropdown)
    [HttpGet]
    public async Task<IActionResult> GetInstructors([FromQuery] string? search, [FromQuery] bool? activeOnly, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Instructors.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(i => i.Name.Contains(search) || (i.Email != null && i.Email.Contains(search)));
        if (activeOnly == true)
            q = q.Where(i => i.IsActive);

        var total = await q.CountAsync();
        var items = await q.OrderBy(i => i.Name).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new {
                i.Id, i.Name, i.Email, i.Phone, i.Bio, i.IsActive, i.CreatedAt,
                sessionsCount = _db.Sessions.Count(s => s.TrainerId == i.Id)
            })
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInstructor(int id)
    {
        var instructor = await _db.Instructors.FindAsync(id);
        if (instructor == null) return NotFound(new { message = "Instructor not found" });
        return Ok(instructor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateInstructor([FromBody] InstructorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Instructor name is required" });

        var instructor = new Instructor {
            Name = req.Name.Trim(),
            Email = req.Email,
            Phone = req.Phone,
            Bio = req.Bio,
            IsActive = true
        };
        _db.Instructors.Add(instructor);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Instructor created", instructorId = instructor.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateInstructor(int id, [FromBody] InstructorRequest req)
    {
        var instructor = await _db.Instructors.FindAsync(id);
        if (instructor == null) return NotFound(new { message = "Instructor not found" });
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Instructor name is required" });

        instructor.Name = req.Name.Trim();
        instructor.Email = req.Email;
        instructor.Phone = req.Phone;
        instructor.Bio = req.Bio;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Instructor updated" });
    }

    [HttpPost("{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var instructor = await _db.Instructors.FindAsync(id);
        if (instructor == null) return NotFound(new { message = "Instructor not found" });
        instructor.IsActive = !instructor.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { message = instructor.IsActive ? "Instructor activated" : "Instructor deactivated", isActive = instructor.IsActive });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteInstructor(int id)
    {
        var instructor = await _db.Instructors.FindAsync(id);
        if (instructor == null) return NotFound(new { message = "Instructor not found" });

        var hasSessions = await _db.Sessions.AnyAsync(s => s.TrainerId == id);
        if (hasSessions)
            return BadRequest(new { message = "This instructor has sessions assigned and cannot be deleted. Deactivate instead." });

        _db.Instructors.Remove(instructor);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Instructor deleted" });
    }
}

public record InstructorRequest(string Name, string? Email, string? Phone, string? Bio);
