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
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StudentsController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GetStudents([FromQuery] string? search, [FromQuery] string? gender, [FromQuery] int? groupId, [FromQuery] int page=1, [FromQuery] int pageSize=10)
    {
        var q=_db.Users.Where(u=>u.Role=="Student"&&u.IsActive).AsQueryable();
        if (UserRole=="Coordinator")
        {
            var myGroupIds=_db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId);
            var myStudentIds=_db.StudentGroups.Where(sg=>myGroupIds.Contains(sg.GroupId)).Select(sg=>sg.StudentId);
            q=q.Where(u=>myStudentIds.Contains(u.Id));
        }
        if (!string.IsNullOrEmpty(search)) q=q.Where(u=>u.Name.Contains(search)||u.Email.Contains(search)||u.StudentCode!.Contains(search));
        if (!string.IsNullOrEmpty(gender)) q=q.Where(u=>u.Gender==gender);
        if (groupId.HasValue) { var ids=_db.StudentGroups.Where(sg=>sg.GroupId==groupId).Select(sg=>sg.StudentId); q=q.Where(u=>ids.Contains(u.Id)); }
        var total=await q.CountAsync();
        var items=await q.OrderBy(u=>u.Name).Skip((page-1)*pageSize).Take(pageSize)
            .Select(u=>new{u.Id,u.Name,u.Email,u.Phone,u.NationalId,u.City,u.Gender,u.IsActive,u.StudentCode,
                groupName=_db.StudentGroups.Where(sg=>sg.StudentId==u.Id).Select(sg=>sg.Group.Name).FirstOrDefault(),
                groupId=_db.StudentGroups.Where(sg=>sg.StudentId==u.Id).Select(sg=>sg.GroupId).FirstOrDefault()
            }).ToListAsync();
        return Ok(new{total,page,pageSize,items});
    }

    [HttpGet("{id}")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GetStudent(int id)
    {
        var u=await _db.Users.Include(x=>x.StudentGroups).ThenInclude(sg=>sg.Group).FirstOrDefaultAsync(x=>x.Id==id&&x.Role=="Student");
        if (u==null) return NotFound();
        return Ok(new{u.Id,u.Name,u.Email,u.Phone,u.NationalId,u.City,u.Gender,u.IsActive,u.StudentCode,u.CreatedAt,
            groups=u.StudentGroups.Select(sg=>new{sg.Group.Id,sg.Group.Name,sg.Group.Code})});
    }

    [HttpPost]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentRequest req)
    {
        if (await _db.Users.AnyAsync(u=>u.Email==req.Email)) return BadRequest(new{message="Email already exists"});
        var code="STU-"+DateTime.UtcNow.Ticks.ToString().Substring(10);
        var student=new User{
            Name=req.Name,Email=req.Email,Role="Student",
            PasswordHash=BCrypt.Net.BCrypt.HashPassword(req.Password),
            Phone=req.Phone,City=req.City,Gender=req.Gender,NationalId=req.NationalId,
            StudentCode=code,IsActive=true
        };
        _db.Users.Add(student);
        await _db.SaveChangesAsync();
        if (req.GroupId.HasValue)
            _db.StudentGroups.Add(new StudentGroup{StudentId=student.Id,GroupId=req.GroupId.Value});
        await _db.SaveChangesAsync();
        return Ok(new{message="Student created",studentCode=code});
    }

    [HttpPut("{id}")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] UpdateStudentRequest req)
    {
        var u=await _db.Users.FindAsync(id);
        if (u==null||u.Role!="Student") return NotFound();
        u.Name=req.Name; u.Phone=req.Phone; u.City=req.City; u.Gender=req.Gender;
        await _db.SaveChangesAsync();
        return Ok(new{message="Student updated"});
    }

    [HttpPost("{id}/change-password")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] StudentResetPasswordRequest req)
    {
        var u=await _db.Users.FindAsync(id);
        if (u==null||u.Role!="Student") return NotFound();
        u.PasswordHash=BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();
        return Ok(new{message="Password reset"});
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var u=await _db.Users.Include(x=>x.StudentGroups).ThenInclude(sg=>sg.Group).FirstOrDefaultAsync(x=>x.Id==UserId);
        if (u==null) return NotFound();
        // attendance stats for student dashboard
        var myGroupIds = u.StudentGroups.Select(sg=>sg.GroupId).ToList();
        var totalSessions=await _db.Sessions.CountAsync(s=>myGroupIds.Contains(s.GroupId)&&s.Status=="finished");
        var attended=await _db.Attendances.CountAsync(a=>a.StudentId==UserId&&a.Joined);
        return Ok(new{u.Id,u.Name,u.Email,u.Phone,u.City,u.Gender,u.Role,u.StudentCode,
            groups=u.StudentGroups.Select(sg=>new{sg.Group.Id,sg.Group.Name,sg.Group.Code}),
            attendanceStats=new{totalSessions,attended,rate=totalSessions>0?Math.Round((double)attended/totalSessions*100,1):0.0}});
    }
}

public record CreateStudentRequest(string Name, string Email, string Password, string? Phone, string? City, string? Gender, string? NationalId, int? GroupId);
public record UpdateStudentRequest(string Name, string? Phone, string? City, string? Gender);
public record StudentResetPasswordRequest(string NewPassword);
