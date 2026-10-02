using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LMS.API.Data;
using System.Security.Claims;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        // ─── Student: rich personal performance dashboard ───
        if (UserRole == "Student")
        {
            var myGroupIds = await _db.StudentGroups.Where(sg => sg.StudentId == UserId).Select(sg => sg.GroupId).ToListAsync();

            // Attendance: count sessions that were actually run (status = running or finished)
            // that belong to the student's groups, then count how many the student attended.
            var mySessionIds = await _db.Sessions
                .Where(s => myGroupIds.Contains(s.GroupId) && (s.Status == "running" || s.Status == "finished"))
                .Select(s => s.Id)
                .ToListAsync();

            var totalRanSessions = mySessionIds.Count;
            var attended = await _db.Attendances
                .CountAsync(a => a.StudentId == UserId && a.Joined && mySessionIds.Contains(a.SessionId));
            var missed = totalRanSessions - attended;
            var attendanceRate = totalRanSessions > 0
                ? Math.Round((double)attended / totalRanSessions * 100, 1)
                : 0.0;

            // Quizzes available to this student (via their groups' sessions)
            var myQuizzes = await _db.Quizzes
                .Where(q => q.Session != null && myGroupIds.Contains(q.Session.GroupId))
                .Include(q => q.Questions)
                .Include(q => q.Session)
                .ToListAsync();
            var myQuizSubs = await _db.QuizSubmissions
                .Where(s => s.StudentId == UserId && myQuizzes.Select(q => q.Id).Contains(s.QuizId))
                .ToListAsync();

            var quizzesTaken = myQuizSubs.Count;
            var quizzesTotal = myQuizzes.Count;
            var quizzesMissed = myQuizzes.Count(q => q.DueDate.HasValue && q.DueDate < DateTime.UtcNow && !myQuizSubs.Any(s => s.QuizId == q.Id));
            var quizzesPending = myQuizzes.Count - quizzesTaken - quizzesMissed;
            var quizPointsObtained = myQuizSubs.Sum(s => s.Score);
            var quizPointsTotal = myQuizSubs.Sum(s => s.TotalPoints);
            var quizAvgPercent = quizPointsTotal > 0 ? Math.Round((double)quizPointsObtained / quizPointsTotal * 100, 1) : 0.0;

            // Assignments available to this student
            var myAssignments = await _db.Assignments
                .Where(a => a.Session != null && myGroupIds.Contains(a.Session.GroupId))
                .Include(a => a.Session)
                .ToListAsync();
            var myAssignSubs = await _db.AssignmentSubmissions
                .Where(s => s.StudentId == UserId && myAssignments.Select(a => a.Id).Contains(s.AssignmentId))
                .ToListAsync();

            var assignmentsSubmitted = myAssignSubs.Count;
            var assignmentsTotal = myAssignments.Count;
            var assignmentsMissed = myAssignments.Count(a => a.DueDate.HasValue && a.DueDate < DateTime.UtcNow && !myAssignSubs.Any(s => s.AssignmentId == a.Id));
            var assignmentsPending = myAssignments.Count - assignmentsSubmitted - assignmentsMissed;
            var gradedSubs = myAssignSubs.Where(s => s.Grade.HasValue).ToList();
            var avgAssignmentGrade = gradedSubs.Any() ? Math.Round(gradedSubs.Average(s => s.Grade!.Value), 1) : 0.0;

            // Combined "overall score report": quiz points + assignment grades normalized to 100 each
            var totalPointsObtained = quizPointsObtained + gradedSubs.Sum(s => s.Grade!.Value);
            var totalPointsPossible = quizPointsTotal + (gradedSubs.Count * 100);
            var overallPercentage = totalPointsPossible > 0 ? Math.Round((double)totalPointsObtained / totalPointsPossible * 100, 1) : 0.0;

            // Per-quiz breakdown (for a small table/chart)
            var quizBreakdown = myQuizzes.Select(q => {
                var sub = myQuizSubs.FirstOrDefault(s => s.QuizId == q.Id);
                var totalPts = q.Questions.Sum(qq => qq.Points);
                return new {
                    id = q.Id,
                    title = q.Title,
                    sessionName = q.Session?.Name,
                    status = sub != null ? "submitted" : (q.DueDate.HasValue && q.DueDate < DateTime.UtcNow ? "missed" : "pending"),
                    score = sub?.Score,
                    totalPoints = sub?.TotalPoints ?? totalPts,
                    submittedAt = sub?.SubmittedAt
                };
            }).OrderByDescending(x => x.submittedAt ?? DateTime.MinValue).Take(10).ToList();

            // Per-assignment breakdown
            var assignmentBreakdown = myAssignments.Select(a => {
                var sub = myAssignSubs.FirstOrDefault(s => s.AssignmentId == a.Id);
                return new {
                    id = a.Id,
                    title = a.Title,
                    sessionName = a.Session?.Name,
                    status = sub != null ? "submitted" : (a.DueDate.HasValue && a.DueDate < DateTime.UtcNow ? "missed" : "pending"),
                    grade = sub?.Grade,
                    isGraded = a.IsGraded,
                    submittedAt = sub?.SubmittedAt
                };
            }).OrderByDescending(x => x.submittedAt ?? DateTime.MinValue).Take(10).ToList();

            // Tickets summary
            var myTicketsTotal = await _db.Tickets.CountAsync(t => t.StudentId == UserId);
            var myTicketsOpen = await _db.Tickets.CountAsync(t => t.StudentId == UserId && t.Status == "in_progress");

            // Upcoming deadlines (open quizzes/assignments with a future due date), soonest first
            var upcomingQuizzes = myQuizzes
                .Where(q => q.DueDate.HasValue && q.DueDate > DateTime.UtcNow && !myQuizSubs.Any(s => s.QuizId == q.Id))
                .Select(q => new { type = "quiz", title = q.Title, dueDate = q.DueDate, sessionName = q.Session?.Name });
            var upcomingAssignments = myAssignments
                .Where(a => a.DueDate.HasValue && a.DueDate > DateTime.UtcNow && !myAssignSubs.Any(s => s.AssignmentId == a.Id))
                .Select(a => new { type = "assignment", title = a.Title, dueDate = a.DueDate, sessionName = a.Session?.Name });
            var upcomingDeadlines = upcomingQuizzes.Concat(upcomingAssignments)
                .OrderBy(x => x.dueDate)
                .Take(5)
                .ToList();

            return Ok(new {
                role = "Student",

                attendance = new {
                    totalSessions = totalRanSessions,
                    attended, missed,
                    rate = attendanceRate
                },

                scoreReport = new {
                    pointsObtained = totalPointsObtained,
                    totalPoints = totalPointsPossible,
                    percentage = overallPercentage
                },

                quizzes = new {
                    total = quizzesTotal,
                    taken = quizzesTaken,
                    pending = Math.Max(quizzesPending, 0),
                    missed = quizzesMissed,
                    pointsObtained = quizPointsObtained,
                    totalPoints = quizPointsTotal,
                    averagePercent = quizAvgPercent
                },

                assignments = new {
                    total = assignmentsTotal,
                    submitted = assignmentsSubmitted,
                    pending = Math.Max(assignmentsPending, 0),
                    missed = assignmentsMissed,
                    averageGrade = avgAssignmentGrade,
                    gradedCount = gradedSubs.Count
                },

                tickets = new { total = myTicketsTotal, open = myTicketsOpen },

                quizBreakdown,
                assignmentBreakdown,
                upcomingDeadlines,

                // Backward-compat fields
                totalFinishedSessions = totalRanSessions, attended, missedSessions = missed, attendanceRate
            });
        }

        IQueryable<int> groupIds;
        if (UserRole=="Admin")
            groupIds=_db.Groups.Select(g=>g.Id);
        else
            groupIds=_db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId);

        var totalStudents    = await _db.StudentGroups.Where(sg=>groupIds.Contains(sg.GroupId)).Select(sg=>sg.StudentId).Distinct().CountAsync();
        var totalAssessments = await _db.Assignments.Where(a=>a.Session!=null&&groupIds.Contains(a.Session.GroupId)).CountAsync()
                             + await _db.Quizzes.Where(q=>q.Session!=null&&groupIds.Contains(q.Session.GroupId)).CountAsync();
        var totalQuizzes     = await _db.Quizzes.Where(q=>q.Session!=null&&groupIds.Contains(q.Session.GroupId)).CountAsync();
        var avgRating        = await _db.SurveySubmissions
                                 .Where(s=>_db.Surveys.Where(sv=>sv.Session!=null&&groupIds.Contains(sv.Session.GroupId)).Select(sv=>sv.Id).Contains(s.SurveyId))
                                 .AverageAsync(s=>(double?)s.Rating)??0;

        var sessions         = await _db.Sessions.Where(s=>groupIds.Contains(s.GroupId)).ToListAsync();
        var totalAttendance  = await _db.Attendances.Where(a=>_db.Sessions.Where(s=>groupIds.Contains(s.GroupId)).Select(s=>s.Id).Contains(a.SessionId)).CountAsync();
        var joinedAttendance = await _db.Attendances.Where(a=>_db.Sessions.Where(s=>groupIds.Contains(s.GroupId)).Select(s=>s.Id).Contains(a.SessionId)&&a.Joined).CountAsync();
        var submittedAssignments = await _db.AssignmentSubmissions.Where(s=>_db.Assignments.Where(a=>a.Session!=null&&groupIds.Contains(a.Session.GroupId)).Select(a=>a.Id).Contains(s.AssignmentId)).CountAsync();
        var expectedAssignments  = await _db.Assignments.Where(a=>a.Session!=null&&groupIds.Contains(a.Session.GroupId)).CountAsync();
        var maleCount   = await _db.StudentGroups.Where(sg=>groupIds.Contains(sg.GroupId)&&sg.Student.Gender=="Male").Select(sg=>sg.StudentId).Distinct().CountAsync();
        var femaleCount = await _db.StudentGroups.Where(sg=>groupIds.Contains(sg.GroupId)&&sg.Student.Gender=="Female").Select(sg=>sg.StudentId).Distinct().CountAsync();

        return Ok(new {
            role=UserRole,
            totalStudents,totalAssessments,totalQuizzes,avgRating=Math.Round(avgRating,2),
            sessions=new{total=sessions.Count,finished=sessions.Count(s=>s.Status=="finished"),pending=sessions.Count(s=>s.Status=="pending"),running=sessions.Count(s=>s.Status=="running")},
            attendance=new{total=totalAttendance,joined=joinedAttendance,notJoined=totalAttendance-joinedAttendance,
                joinRate=totalAttendance>0?Math.Round((double)joinedAttendance/totalAttendance*100,2):0.0},
            assignments=new{total=expectedAssignments,submitted=submittedAssignments,nonSubmitted=expectedAssignments-submittedAssignments,
                rate=expectedAssignments>0?Math.Round((double)submittedAssignments/expectedAssignments*100,2):0.0},
            gender=new{male=maleCount,female=femaleCount}
        });
    }
}
