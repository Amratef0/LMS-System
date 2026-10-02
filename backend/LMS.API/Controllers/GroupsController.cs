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
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _db;
    public GroupsController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    public async Task<IActionResult> GetGroups([FromQuery] string? search, [FromQuery] int page=1, [FromQuery] int pageSize=20)
    {
        var q=_db.Groups.AsQueryable();
        if (UserRole=="Coordinator") { var myIds=_db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId); q=q.Where(g=>myIds.Contains(g.Id)); }
        else if (UserRole=="Student") { var myIds=_db.StudentGroups.Where(sg=>sg.StudentId==UserId).Select(sg=>sg.GroupId); q=q.Where(g=>myIds.Contains(g.Id)); }
        if (!string.IsNullOrEmpty(search)) q=q.Where(g=>g.Name.Contains(search)||g.Code.Contains(search));
        var total=await q.CountAsync();
        var items=await q.OrderBy(g=>g.Name).Skip((page-1)*pageSize).Take(pageSize)
            .Select(g=>new{
                g.Id,g.Name,g.Code,g.StartDate,g.EndDate,g.IsActive,
                coordinators=_db.CoordinatorGroups.Where(cg=>cg.GroupId==g.Id).Select(cg=>new{cg.Coordinator.Id,cg.Coordinator.Name,cg.Coordinator.Email}).ToList(),
                studentsCount=_db.StudentGroups.Count(sg=>sg.GroupId==g.Id)
            }).ToListAsync();
        return Ok(new{total,page,pageSize,items});
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroup(int id)
    {
        var g=await _db.Groups
            .Include(x=>x.CoordinatorGroups).ThenInclude(cg=>cg.Coordinator)
            .Include(x=>x.StudentGroups).ThenInclude(sg=>sg.Student)
            .Include(x=>x.Teams).ThenInclude(t=>t.Members)
            .FirstOrDefaultAsync(x=>x.Id==id);
        if (g==null) return NotFound();
        return Ok(new{g.Id,g.Name,g.Code,g.StartDate,g.EndDate,g.IsActive,
            coordinators=g.CoordinatorGroups.Select(cg=>new{cg.CoordinatorId,cg.Coordinator.Name,cg.Coordinator.Email}),
            students=g.StudentGroups.Select(sg=>new{sg.Student.Id,sg.Student.Name,sg.Student.Email,sg.Student.StudentCode}),
            teams=g.Teams.Select(t=>new{t.Id,t.Name,t.CreatedAt,studentsCount=t.Members.Count})});
    }

    [HttpPost]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest req)
    {
        if (await _db.Groups.AnyAsync(g=>g.Code==req.Code)) return BadRequest(new{message="Group code already exists"});
        var group=new Group{Name=req.Name,Code=req.Code,StartDate=req.StartDate,EndDate=req.EndDate};
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();
        if (req.CoordinatorIds?.Any()==true)
            foreach (var cid in req.CoordinatorIds)
                _db.CoordinatorGroups.Add(new CoordinatorGroup{CoordinatorId=cid,GroupId=group.Id});
        await _db.SaveChangesAsync();
        return Ok(new{message="Group created",groupId=group.Id});
    }

    [HttpPut("{id}")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> UpdateGroup(int id, [FromBody] UpdateGroupRequest req)
    {
        var g=await _db.Groups.FindAsync(id);
        if (g==null) return NotFound();
        g.Name=req.Name; g.StartDate=req.StartDate; g.EndDate=req.EndDate; g.IsActive=req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new{message="Group updated"});
    }

    [HttpPost("{id}/assign-coordinator")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> AssignCoordinator(int id, [FromBody] AssignCoordRequest req)
    {
        // Remove existing if re-assigning
        if (req.Replace)
        {
            var existing=_db.CoordinatorGroups.Where(cg=>cg.GroupId==id);
            _db.CoordinatorGroups.RemoveRange(existing);
        }
        if (!await _db.CoordinatorGroups.AnyAsync(cg=>cg.GroupId==id&&cg.CoordinatorId==req.CoordinatorId))
            _db.CoordinatorGroups.Add(new CoordinatorGroup{GroupId=id,CoordinatorId=req.CoordinatorId});
        await _db.SaveChangesAsync();
        return Ok(new{message="Coordinator assigned"});
    }

    [HttpDelete("{id}/coordinators/{coordId}")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> RemoveCoordinator(int id, int coordId)
    {
        var cg=await _db.CoordinatorGroups.FirstOrDefaultAsync(x=>x.GroupId==id&&x.CoordinatorId==coordId);
        if (cg==null) return NotFound();
        _db.CoordinatorGroups.Remove(cg);
        await _db.SaveChangesAsync();
        return Ok(new{message="Coordinator removed"});
    }

    [HttpGet("{id}/teams")]
    public async Task<IActionResult> GetTeams(int id)
    {
        var teams=await _db.Teams.Where(t=>t.GroupId==id).Include(t=>t.TeamLead).Include(t=>t.Members).ThenInclude(m=>m.Student)
            .Select(t=>new{t.Id,t.Name,t.CreatedAt,teamLead=t.TeamLead!=null?new{t.TeamLead.Id,t.TeamLead.Name}:null,studentsCount=t.Members.Count}).ToListAsync();
        return Ok(teams);
    }

    [HttpPost("{id}/teams")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> CreateTeam(int id, [FromBody] CreateTeamRequest req)
    {
        var team=new Team{Name=req.Name,GroupId=id,TeamLeadId=req.TeamLeadId};
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();
        if (req.StudentIds?.Any()==true)
            foreach (var sid in req.StudentIds)
                _db.TeamMembers.Add(new TeamMember{TeamId=team.Id,StudentId=sid});
        await _db.SaveChangesAsync();
        return Ok(new{message="Team created",teamId=team.Id});
    }
}

public record CreateGroupRequest(string Name, string Code, DateTime StartDate, DateTime EndDate, List<int>? CoordinatorIds);
public record UpdateGroupRequest(string Name, DateTime StartDate, DateTime EndDate, bool IsActive);
public record AssignCoordRequest(int CoordinatorId, bool Replace=false);
public record CreateTeamRequest(string Name, int? TeamLeadId, List<int>? StudentIds);
