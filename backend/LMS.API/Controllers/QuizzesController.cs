using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LMS.API.Data;
using LMS.API.Models;
using System.Security.Claims;
using System.Text.Json;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizzesController : ControllerBase
{
    private readonly AppDbContext _db;
    public QuizzesController(AppDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet]
    public async Task<IActionResult> GetQuizzes([FromQuery] string? type, [FromQuery] bool? isGraded, [FromQuery] int page=1, [FromQuery] int pageSize=10)
    {
        var q = _db.Quizzes.Include(x => x.Session).ThenInclude(s => s!.Group).AsQueryable();
        if (UserRole=="Coordinator")
        {
            var myIds = _db.CoordinatorGroups.Where(cg=>cg.CoordinatorId==UserId).Select(cg=>cg.GroupId);
            q = q.Where(x => x.Session!=null && myIds.Contains(x.Session.GroupId));
        }
        else if (UserRole=="Student")
        {
            var myIds = _db.StudentGroups.Where(sg=>sg.StudentId==UserId).Select(sg=>sg.GroupId);
            q = q.Where(x => x.Session!=null && myIds.Contains(x.Session.GroupId));
        }
        if (!string.IsNullOrEmpty(type))  q = q.Where(x=>x.Type==type);
        if (isGraded.HasValue)            q = q.Where(x=>x.IsGraded==isGraded);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(x=>x.CreatedAt).Skip((page-1)*pageSize).Take(pageSize)
            .Select(x => new {
                x.Id, x.Title, x.Type, x.IsGraded, x.CreatedAt, x.DueDate,
                session=x.Session!=null?new{x.Session.Id,x.Session.Name}:null,
                submissionsCount=x.Submissions.Count
            }).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuiz(int id)
    {
        var quiz = await _db.Quizzes
            .Include(q => q.Questions)
            .Include(q => q.Session)
            .Include(q => q.Submissions).ThenInclude(s => s.Student)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return NotFound(new { message = "Quiz not found" });

        var isStudent = UserRole == "Student";

        var questionsList = new List<object>();
        foreach (var q in quiz.Questions.OrderBy(q => q.Order))
        {
            if (isStudent)
            {
                questionsList.Add(new {
                    q.Id, q.QuestionText, q.OptionA, q.OptionB, q.OptionC, q.OptionD,
                    q.Points, q.Order
                });
            }
            else
            {
                questionsList.Add(new {
                    q.Id, q.QuestionText, q.OptionA, q.OptionB, q.OptionC, q.OptionD,
                    q.Points, q.Order, q.CorrectAnswer
                });
            }
        }

        List<object> submissionsList;
        if (isStudent)
        {
            submissionsList = quiz.Submissions
                .Where(s => s.StudentId == UserId)
                .Select(s => (object)new { s.Id, s.Score, s.TotalPoints, s.SubmittedAt })
                .ToList();
        }
        else
        {
            submissionsList = quiz.Submissions
                .Select(s => (object)new {
                    s.Id,
                    student = new { s.Student.Id, s.Student.Name, s.Student.StudentCode },
                    s.Score, s.TotalPoints, s.SubmittedAt, s.Answers
                })
                .ToList();
        }

        return Ok(new {
            quiz.Id, quiz.Title, quiz.Type, quiz.IsGraded, quiz.CreatedAt, quiz.DueDate,
            session = quiz.Session != null ? new { quiz.Session.Id, quiz.Session.Name } : null,
            totalPoints = quiz.Questions.Sum(q => q.Points),
            questions = questionsList,
            submissions = submissionsList
        });
    }

    [HttpPost]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Quiz title is required" });
        if (req.Questions == null || req.Questions.Count == 0)
            return BadRequest(new { message = "A quiz must have at least one question" });
        foreach (var q in req.Questions)
        {
            if (string.IsNullOrWhiteSpace(q.QuestionText))
                return BadRequest(new { message = "Every question must have text" });
            if (string.IsNullOrWhiteSpace(q.CorrectAnswer))
                return BadRequest(new { message = "Every question must have a correct answer selected" });
        }
        if (req.SessionId.HasValue)
        {
            var session = await _db.Sessions.FindAsync(req.SessionId);
            if (session!=null && session.Status!="running" && session.Status!="finished")
                return BadRequest(new { message="Session must be running or finished to add a quiz" });
        }
        var quiz = new Quiz { Title=req.Title, Type=req.Type, IsGraded=req.IsGraded, DueDate=req.DueDate, SessionId=req.SessionId };
        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();
        foreach (var (q,i) in req.Questions.Select((q,i)=>(q,i)))
            _db.QuizQuestions.Add(new QuizQuestion {
                QuizId=quiz.Id, QuestionText=q.QuestionText,
                OptionA=q.OptionA, OptionB=q.OptionB, OptionC=q.OptionC, OptionD=q.OptionD,
                CorrectAnswer=q.CorrectAnswer, Points=q.Points>0?q.Points:1, Order=i+1
            });
        await _db.SaveChangesAsync();
        return Ok(new { message="Quiz created", quizId=quiz.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> UpdateQuiz(int id, [FromBody] CreateQuizRequest req)
    {
        var quiz = await _db.Quizzes.Include(q=>q.Questions).FirstOrDefaultAsync(q=>q.Id==id);
        if (quiz==null) return NotFound();
        quiz.Title=req.Title; quiz.Type=req.Type; quiz.IsGraded=req.IsGraded; quiz.DueDate=req.DueDate;
        _db.QuizQuestions.RemoveRange(quiz.Questions);
        foreach (var (q,i) in req.Questions.Select((q,i)=>(q,i)))
            _db.QuizQuestions.Add(new QuizQuestion {
                QuizId=id, QuestionText=q.QuestionText,
                OptionA=q.OptionA, OptionB=q.OptionB, OptionC=q.OptionC, OptionD=q.OptionD,
                CorrectAnswer=q.CorrectAnswer, Points=q.Points>0?q.Points:1, Order=i+1
            });
        await _db.SaveChangesAsync();
        return Ok(new { message="Quiz updated" });
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles="Student")]
    public async Task<IActionResult> SubmitQuiz(int id, [FromBody] SubmitQuizRequest req)
    {
        var quiz = await _db.Quizzes.Include(q=>q.Questions).FirstOrDefaultAsync(q=>q.Id==id);
        if (quiz==null) return NotFound();
        if (quiz.DueDate.HasValue && DateTime.UtcNow>quiz.DueDate) return BadRequest(new{message="Quiz deadline has passed"});
        if (await _db.QuizSubmissions.AnyAsync(s=>s.QuizId==id && s.StudentId==UserId)) return BadRequest(new{message="Already submitted"});
        int score=0, totalPoints=quiz.Questions.Sum(q=>q.Points);
        if (quiz.IsGraded)
            score=req.Answers.Sum(a=>{
                var q=quiz.Questions.FirstOrDefault(q=>q.Id==a.QuestionId);
                return (q!=null && q.CorrectAnswer==a.Answer)?q.Points:0;
            });
        _db.QuizSubmissions.Add(new QuizSubmission {
            QuizId=id, StudentId=UserId, Score=score, TotalPoints=totalPoints,
            Answers=JsonSerializer.Serialize(req.Answers)
        });
        await _db.SaveChangesAsync();
        return Ok(new { message="Submitted", score, totalPoints });
    }

    [HttpGet("{id}/submissions")]
    [Authorize(Roles="Admin,Coordinator")]
    public async Task<IActionResult> GetSubmissions(int id)
    {
        var quiz = await _db.Quizzes.Include(q=>q.Session).ThenInclude(s=>s!.Group).FirstOrDefaultAsync(q=>q.Id==id);
        if (quiz==null) return NotFound();
        var totalExpected = quiz.Session!=null ? await _db.StudentGroups.CountAsync(sg=>sg.GroupId==quiz.Session.GroupId) : 0;
        var subs = await _db.QuizSubmissions.Where(s=>s.QuizId==id)
            .Include(s=>s.Student)
            .OrderByDescending(s=>s.SubmittedAt)
            .Select(s=>new{s.Id,student=new{s.Student.Id,s.Student.Name,s.Student.StudentCode},s.Score,s.TotalPoints,s.SubmittedAt})
            .ToListAsync();
        return Ok(new { totalExpected, submitted=subs.Count, nonSubmitted=totalExpected-subs.Count, submissions=subs });
    }
}

public record CreateQuizRequest(string Title, string Type, bool IsGraded, DateTime? DueDate, int? SessionId, List<QuizQuestionReq> Questions);
public record QuizQuestionReq(string QuestionText, string? OptionA, string? OptionB, string? OptionC, string? OptionD, string CorrectAnswer, int Points);
public record SubmitQuizRequest(List<QuizAnswerReq> Answers);
public record QuizAnswerReq(int QuestionId, string Answer);
