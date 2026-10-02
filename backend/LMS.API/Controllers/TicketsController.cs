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
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TicketsController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GetTickets([FromQuery] string? status, [FromQuery] int page=1, [FromQuery] int pageSize=20)
    {
        var q=_db.Tickets.Include(t=>t.Student).Include(t=>t.Replies).AsQueryable();
        if (UserRole=="Coordinator")
        {
            var myGroupIds=_db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId);
            var myStudentIds=_db.StudentGroups.Where(sg=>myGroupIds.Contains(sg.GroupId)).Select(sg=>sg.StudentId);
            q=q.Where(t=>myStudentIds.Contains(t.StudentId));
        }
        if (!string.IsNullOrEmpty(status)) q=q.Where(t=>t.Status==status);
        var total=await q.CountAsync();
        var inProgress=await q.CountAsync(t=>t.Status=="in_progress");
        var resolved=await q.CountAsync(t=>t.Status=="resolved");
        var closed=await q.CountAsync(t=>t.Status=="closed");
        var reopened=await q.CountAsync(t=>t.Status=="reopened");
        var items=await q.OrderByDescending(t=>t.CreatedAt).Skip((page-1)*pageSize).Take(pageSize)
            .Select(t=>new{t.Id,t.Title,t.Description,t.Status,t.CreatedAt,
                student=new{t.Student.Id,t.Student.Name,t.Student.Email,
                    groupName=_db.StudentGroups.Where(sg=>sg.StudentId==t.StudentId).Select(sg=>sg.Group.Name).FirstOrDefault()},
                repliesCount=t.Replies.Count}).ToListAsync();
        return Ok(new{total,inProgress,resolved,closed,reopened,page,pageSize,items});
    }

    // Student: create ticket only
    [HttpPost]
    [Authorize(Roles="Student")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest req)
    {
        _db.Tickets.Add(new Ticket{Title=req.Title,Description=req.Description,StudentId=UserId});
        await _db.SaveChangesAsync();
        return Ok(new{message="Ticket submitted successfully"});
    }

    // Student: view own tickets (only list, no status tabs)
    [HttpGet("my")]
    [Authorize(Roles="Student")]
    public async Task<IActionResult> GetMyTickets()
    {
        var tickets=await _db.Tickets.Where(t=>t.StudentId==UserId)
            .OrderByDescending(t=>t.CreatedAt)
            .Select(t=>new{t.Id,t.Title,t.Description,t.Status,t.CreatedAt})
            .ToListAsync();
        return Ok(tickets);
    }

    [HttpPost("{id}/reply")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> Reply(int id, [FromBody] ReplyRequest req)
    {
        var ticket=await _db.Tickets.FindAsync(id);
        if (ticket==null) return NotFound();
        _db.TicketReplies.Add(new TicketReply{TicketId=id,UserId=UserId,Message=req.Message});
        await _db.SaveChangesAsync();
        return Ok(new{message="Reply sent"});
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var ticket=await _db.Tickets.FindAsync(id);
        if (ticket==null) return NotFound();
        ticket.Status=req.Status; ticket.UpdatedAt=DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new{message="Status updated"});
    }
}

public record ReplyRequest(string Message);
public record CreateTicketRequest(string Title, string Description);
public record UpdateStatusRequest(string Status);
