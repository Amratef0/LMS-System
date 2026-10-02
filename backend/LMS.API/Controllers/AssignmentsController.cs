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
public class AssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AssignmentsController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    public async Task<IActionResult> GetAssignments([FromQuery] bool? isGraded, [FromQuery] int? groupId, [FromQuery] int page=1, [FromQuery] int pageSize=10)
    {
        var q = _db.Assignments.Include(a=>a.Session).ThenInclude(s=>s!.Group).AsQueryable();
        if (UserRole=="Coordinator") { var myIds=_db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId); q=q.Where(a=>a.Session!=null&&myIds.Contains(a.Session.GroupId)); }
        else if (UserRole=="Student") { var myIds=_db.StudentGroups.Where(sg=>sg.StudentId==UserId).Select(sg=>sg.GroupId); q=q.Where(a=>a.Session!=null&&myIds.Contains(a.Session.GroupId)); }
        if (isGraded.HasValue) q=q.Where(a=>a.IsGraded==isGraded);
        if (groupId.HasValue)  q=q.Where(a=>a.Session!=null&&a.Session.GroupId==groupId);
        var total=await q.CountAsync();
        var items=await q.OrderByDescending(a=>a.CreatedAt).Skip((page-1)*pageSize).Take(pageSize)
            .Select(a=>new{a.Id,a.Title,a.IsGraded,a.CreatedAt,a.DueDate,a.Description,
                session=a.Session!=null?new{a.Session.Id,a.Session.Name}:null,
                submissionsCount=a.Submissions.Count}).ToListAsync();
        return Ok(new{total,page,pageSize,items});
    }

    [HttpGet("{id}/submissions")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GetSubmissions(int id, [FromQuery] int page=1, [FromQuery] int pageSize=20)
    {
        var assignment=await _db.Assignments.Include(a=>a.Session).ThenInclude(s=>s!.Group).FirstOrDefaultAsync(a=>a.Id==id);
        if (assignment==null) return NotFound();
        var totalExpected=assignment.Session!=null ? await _db.StudentGroups.CountAsync(sg=>sg.GroupId==assignment.Session.GroupId) : 0;
        var q=_db.AssignmentSubmissions.Where(s=>s.AssignmentId==id).Include(s=>s.Student);
        var total=await q.CountAsync();
        var items=await q.OrderByDescending(s=>s.SubmittedAt).Skip((page-1)*pageSize).Take(pageSize)
            .Select(s=>new{s.Id,student=new{s.Student.Id,s.Student.Name,s.Student.StudentCode},s.FileUrl,s.Link,s.SubmissionType,s.Grade,s.GradeFeedback,s.SubmittedAt})
            .ToListAsync();

        // Get missed students (past deadline, no submission)
        var submittedStudentIds = await _db.AssignmentSubmissions.Where(s=>s.AssignmentId==id).Select(s=>s.StudentId).ToListAsync();
        List<object> missed = new();
        if (assignment.DueDate.HasValue && DateTime.UtcNow > assignment.DueDate && assignment.Session!=null)
        {
            var allStudents = await _db.StudentGroups.Where(sg=>sg.GroupId==assignment.Session.GroupId).Include(sg=>sg.Student).ToListAsync();
            missed = allStudents.Where(sg=>!submittedStudentIds.Contains(sg.StudentId))
                .Select(sg=>(object)new{sg.Student.Id,sg.Student.Name,sg.Student.StudentCode}).ToList();
        }
        return Ok(new{totalExpected,submitted=total,nonSubmitted=totalExpected-total,page,pageSize,items,missed});
    }

    [HttpPost]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentRequest req)
    {
        _db.Assignments.Add(new Assignment{Title=req.Title,Description=req.Description,IsGraded=req.IsGraded,DueDate=req.DueDate,SessionId=req.SessionId});
        await _db.SaveChangesAsync();
        return Ok(new{message="Assignment created"});
    }

    [HttpPut("{id}")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> UpdateAssignment(int id, [FromBody] CreateAssignmentRequest req)
    {
        var a=await _db.Assignments.FindAsync(id);
        if (a==null) return NotFound();
        a.Title=req.Title; a.Description=req.Description; a.IsGraded=req.IsGraded; a.DueDate=req.DueDate;
        await _db.SaveChangesAsync();
        return Ok(new{message="Assignment updated"});
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles="Student")]
    public async Task<IActionResult> Submit(int id, [FromBody] SubmitAssignmentRequest req)
    {
        var assignment=await _db.Assignments.FindAsync(id);
        if (assignment==null) return NotFound();
        if (assignment.DueDate.HasValue && DateTime.UtcNow>assignment.DueDate) return BadRequest(new{message="Assignment deadline has passed"});
        if (await _db.AssignmentSubmissions.AnyAsync(s=>s.AssignmentId==id&&s.StudentId==UserId)) return BadRequest(new{message="Already submitted"});
        _db.AssignmentSubmissions.Add(new AssignmentSubmission{AssignmentId=id,StudentId=UserId,FileUrl=req.FileUrl,Link=req.Link,SubmissionType=req.SubmissionType,Notes=req.Notes});
        await _db.SaveChangesAsync();
        return Ok(new{message="Submitted"});
    }

    [HttpPost("{id}/submissions/{subId}/grade")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GradeSubmission(int id, int subId, [FromBody] GradeRequest req)
    {
        var sub=await _db.AssignmentSubmissions.FirstOrDefaultAsync(s=>s.Id==subId&&s.AssignmentId==id);
        if (sub==null) return NotFound();
        sub.Grade=req.Grade; sub.GradeFeedback=req.Feedback;
        await _db.SaveChangesAsync();
        return Ok(new{message="Graded"});
    }
}

public record CreateAssignmentRequest(string Title, string? Description, bool IsGraded, DateTime? DueDate, int? SessionId);
public record SubmitAssignmentRequest(string SubmissionType, string? FileUrl, string? Link, string? Notes);
public record GradeRequest(int Grade, string? Feedback);
