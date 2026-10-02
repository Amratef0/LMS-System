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
public class SessionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SessionsController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    private IQueryable<Session> GetAllowedSessions()
    {
        var q = _db.Sessions
            .Include(s => s.Trainer).Include(s => s.Group)
            .Include(s => s.StartedBy).Include(s => s.EndedBy).Include(s => s.AttendanceTakenBy)
            .AsQueryable();
        if (UserRole == "Coordinator")
        {
            var myGroupIds = _db.CoordinatorGroups.Where(cg => cg.CoordinatorId == UserId).Select(cg => cg.GroupId);
            q = q.Where(s => myGroupIds.Contains(s.GroupId));
        }
        else if (UserRole == "Student")
        {
            var myGroupIds = _db.StudentGroups.Where(sg => sg.StudentId == UserId).Select(sg => sg.GroupId);
            q = q.Where(s => myGroupIds.Contains(s.GroupId));
        }
        return q;
    }

    [HttpGet]
    public async Task<IActionResult> GetSessions(
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? type,
        [FromQuery] string? topic, [FromQuery] int? groupId, [FromQuery] int? trainerId,
        [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var q = GetAllowedSessions();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(s => s.Name.Contains(search) || s.Group.Code.Contains(search));
        if (!string.IsNullOrEmpty(status))  q = q.Where(s => s.Status == status);
        if (!string.IsNullOrEmpty(type))    q = q.Where(s => s.Type == type);
        if (!string.IsNullOrEmpty(topic))   q = q.Where(s => s.Topic == topic);
        if (groupId.HasValue)               q = q.Where(s => s.GroupId == groupId);
        if (trainerId.HasValue)             q = q.Where(s => s.TrainerId == trainerId);
        if (dateFrom.HasValue)              q = q.Where(s => s.SessionDate >= dateFrom);
        if (dateTo.HasValue)                q = q.Where(s => s.SessionDate <= dateTo);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(s => s.SessionDate)
            .Skip((page-1)*pageSize).Take(pageSize)
            .Select(s => new {
                s.Id, s.Name,
                trainer = new { s.Trainer.Id, s.Trainer.Name },
                s.SessionDate, s.Type, s.Topic, s.Status,
                group = new { s.Group.Id, s.Group.Name, s.Group.Code },
                s.RecordLink, s.Location
            }).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSession(int id)
    {
        var s = await GetAllowedSessions()
            .Include(x => x.Attachments).ThenInclude(a => a.UploadedBy)
            .Include(x => x.Quizzes).ThenInclude(q => q.Submissions)
            .Include(x => x.Assignments).ThenInclude(a => a.Submissions)
            .Include(x => x.Attendances)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        var totalStudents = await _db.StudentGroups.CountAsync(sg => sg.GroupId == s.GroupId);
        var joinedStudents = s.Attendances.Count(a => a.Joined);

        // For student: get their own attendance
        Attendance? myAttendance = null;
        if (UserRole == "Student")
            myAttendance = s.Attendances.FirstOrDefault(a => a.StudentId == UserId);

        return Ok(new {
            s.Id, s.Name, s.SessionDate, s.Type, s.Topic, s.Status,
            s.RecordLink, s.Location,
            trainer = new { s.Trainer.Id, s.Trainer.Name },
            group = new { s.Group.Id, s.Group.Name, s.Group.Code },
            attendanceStatus = s.AttendanceTakenAt.HasValue ? "taken" : "not_taken",
            attendance = new { total = totalStudents, joined = joinedStudents },
            myAttendance = myAttendance == null ? null : new { myAttendance.Joined },
            timeTracking = new {
                startedBy    = s.StartedBy    != null ? new { s.StartedBy.Id,    s.StartedBy.Name }    : null,
                s.StartedAt,
                endedBy      = s.EndedBy      != null ? new { s.EndedBy.Id,      s.EndedBy.Name }      : null,
                s.EndedAt,
                attendanceTakenBy = s.AttendanceTakenBy != null ? new { s.AttendanceTakenBy.Id, s.AttendanceTakenBy.Name } : null,
                s.AttendanceTakenAt
            },
            attachments = s.Attachments.Select(a => new { a.Id, a.Title, a.FileUrl, a.Link, a.AttachmentType, uploadedBy = a.UploadedBy.Name, a.CreatedAt }),
            quizzes     = s.Quizzes.Select(q => new {
                q.Id, q.Title, q.Type, q.DueDate, submissionsCount = q.Submissions.Count,
                mySubmission = UserRole == "Student"
                    ? q.Submissions.Where(sub => sub.StudentId == UserId).Select(sub => new { sub.Score, sub.TotalPoints }).FirstOrDefault()
                    : null
            }),
            assignments = s.Assignments.Select(a => new {
                a.Id, a.Title, a.DueDate, a.Description, a.IsGraded, submissionsCount = a.Submissions.Count,
                mySubmitted = UserRole == "Student" && a.Submissions.Any(sub => sub.StudentId == UserId),
                mySubmission = UserRole == "Student"
                    ? a.Submissions.Where(sub => sub.StudentId == UserId).Select(sub => new { sub.Grade, sub.GradeFeedback }).FirstOrDefault()
                    : null
            })
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest req)
    {
        var instructor = await _db.Instructors.FindAsync(req.TrainerId);
        if (instructor == null) return BadRequest(new { message = "Instructor not found" });
        if (!instructor.IsActive) return BadRequest(new { message = "This instructor is inactive" });
        _db.Sessions.Add(new Session {
            Name = req.Name, TrainerId = req.TrainerId, SessionDate = req.SessionDate,
            GroupId = req.GroupId, Type = req.Type, Topic = req.Topic,
            Location = req.Location, RecordLink = req.RecordLink
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Session created" });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateSessionRequest req)
    {
        var s = await _db.Sessions.FindAsync(id);
        if (s == null) return NotFound();
        var instructor = await _db.Instructors.FindAsync(req.TrainerId);
        if (instructor == null) return BadRequest(new { message = "Instructor not found" });
        s.Name = req.Name; s.SessionDate = req.SessionDate; s.Type = req.Type;
        s.Topic = req.Topic; s.Location = req.Location; s.TrainerId = req.TrainerId;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Session updated" });
    }

    [HttpPost("{id}/run")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> RunSession(int id)
    {
        var s = await _db.Sessions.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != "pending") return BadRequest(new { message = "Session is not pending" });
        s.Status = "running"; s.StartedById = UserId; s.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Session started" });
    }

    [HttpPost("{id}/finish")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> FinishSession(int id)
    {
        var s = await _db.Sessions.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status != "running") return BadRequest(new { message = "Session is not running" });
        if (!s.AttendanceTakenAt.HasValue) return BadRequest(new { message = "Please take attendance before finishing" });
        s.Status = "finished"; s.EndedById = UserId; s.EndedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Session finished" });
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> CancelSession(int id)
    {
        var s = await _db.Sessions.FindAsync(id);
        if (s == null) return NotFound();
        if (s.Status == "finished") return BadRequest(new { message = "Cannot cancel a finished session" });
        s.Status = "cancelled";
        await _db.SaveChangesAsync();
        return Ok(new { message = "Session cancelled" });
    }

    [HttpGet("{id}/attendance")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> GetAttendance(int id)
    {
        var session = await _db.Sessions.Include(s => s.Group).FirstOrDefaultAsync(s => s.Id == id);
        if (session == null) return NotFound();
        var students   = await _db.StudentGroups.Where(sg => sg.GroupId == session.GroupId).Include(sg => sg.Student).ToListAsync();
        var attendances= await _db.Attendances.Where(a => a.SessionId == id).ToListAsync();
        var result = students.Select(sg => {
            var att = attendances.FirstOrDefault(a => a.StudentId == sg.StudentId);
            return new { studentId = sg.StudentId, studentName = sg.Student.Name, studentCode = sg.Student.StudentCode, joined = att?.Joined ?? false };
        });
        return Ok(result);
    }

    [HttpPost("{id}/attendance")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> SaveAttendance(int id, [FromBody] List<AttendanceItem> items)
    {
        var session = await _db.Sessions.FindAsync(id);
        if (session == null) return NotFound();
        if (session.Status != "running" && session.Status != "finished")
            return BadRequest(new { message = "Session must be running or finished" });
        foreach (var item in items)
        {
            var att = await _db.Attendances.FirstOrDefaultAsync(a => a.SessionId == id && a.StudentId == item.StudentId);
            if (att == null)
                _db.Attendances.Add(new Attendance { SessionId=id, StudentId=item.StudentId, Joined=item.Joined, JoinedAt=item.Joined?DateTime.UtcNow:null });
            else { att.Joined=item.Joined; att.JoinedAt=item.Joined?(att.JoinedAt??DateTime.UtcNow):null; }
        }
        if (!session.AttendanceTakenAt.HasValue) { session.AttendanceTakenById=UserId; session.AttendanceTakenAt=DateTime.UtcNow; }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Attendance saved" });
    }

    [HttpPost("{id}/attachments")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> AddAttachment(int id, [FromBody] AttachmentRequest req)
    {
        _db.SessionAttachments.Add(new SessionAttachment { SessionId=id, Title=req.Title, AttachmentType=req.AttachmentType, FileUrl=req.FileUrl, Link=req.Link, UploadedById=UserId });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Attachment added" });
    }

    [HttpPut("{id}/attachments/{attachId}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> UpdateAttachment(int id, int attachId, [FromBody] AttachmentRequest req)
    {
        var att = await _db.SessionAttachments.FirstOrDefaultAsync(a => a.Id==attachId && a.SessionId==id);
        if (att == null) return NotFound();
        att.Title=req.Title; att.FileUrl=req.FileUrl; att.Link=req.Link; att.AttachmentType=req.AttachmentType;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    [HttpDelete("{id}/attachments/{attachId}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> DeleteAttachment(int id, int attachId)
    {
        var att = await _db.SessionAttachments.FirstOrDefaultAsync(a => a.Id==attachId && a.SessionId==id);
        if (att == null) return NotFound();
        _db.SessionAttachments.Remove(att);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    [HttpPut("{id}/record-link")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> UpdateRecordLink(int id, [FromBody] RecordLinkRequest req)
    {
        var s = await _db.Sessions.FindAsync(id);
        if (s == null) return NotFound();
        s.RecordLink = req.RecordLink;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Record link updated" });
    }
}

public record AttendanceItem(int StudentId, bool Joined);
public record AttachmentRequest(string Title, string AttachmentType, string? FileUrl, string? Link);
public record RecordLinkRequest(string RecordLink);
public record CreateSessionRequest(string Name, int TrainerId, DateTime SessionDate, int GroupId, string Type, string Topic, string? Location, string? RecordLink);
public record UpdateSessionRequest(string Name, int TrainerId, DateTime SessionDate, string Type, string Topic, string? Location);
