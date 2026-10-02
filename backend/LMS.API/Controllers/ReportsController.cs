using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LMS.API.Data;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Security.Claims;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string UserRole => User.FindFirst(ClaimTypes.Role)!.Value;

    // ─────────────────────────────────────────────────────────────
    // 1. ATTENDANCE REPORT  (Excel)
    //    GET /api/reports/attendance?groupId=1
    // ─────────────────────────────────────────────────────────────
    [HttpGet("attendance")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> AttendanceReport([FromQuery] int groupId)
    {
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return NotFound(new { message = "Group not found" });

        // Coordinator can only access their own groups
        if (UserRole == "Coordinator")
        {
            var hasAccess = await _db.CoordinatorGroups
                .AnyAsync(cg => cg.CoordinatorId == UserId && cg.GroupId == groupId);
            if (!hasAccess) return Forbid();
        }

        var sessions = await _db.Sessions
            .Where(s => s.GroupId == groupId && (s.Status == "running" || s.Status == "finished"))
            .OrderBy(s => s.SessionDate)
            .Select(s => new { s.Id, s.Name, s.SessionDate })
            .ToListAsync();

        var students = await _db.StudentGroups
            .Where(sg => sg.GroupId == groupId)
            .Include(sg => sg.Student)
            .OrderBy(sg => sg.Student.Name)
            .Select(sg => new { sg.Student.Id, sg.Student.Name, sg.Student.StudentCode })
            .ToListAsync();

        var attendances = await _db.Attendances
            .Where(a => sessions.Select(s => s.Id).Contains(a.SessionId))
            .ToListAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Attendance");

        // ── Header styling ──
        var titleCell = ws.Cell(1, 1);
        titleCell.Value = $"Attendance Report — {group.Name}";
        titleCell.Style.Font.Bold = true;
        titleCell.Style.Font.FontSize = 14;
        ws.Cell(2, 1).Value = $"Generated: {DateTime.Now:dd MMM yyyy HH:mm}";
        ws.Cell(2, 1).Style.Font.Italic = true;
        ws.Cell(2, 1).Style.Font.FontColor = XLColor.Gray;

        // ── Column headers ──
        int headerRow = 4;
        ws.Cell(headerRow, 1).Value = "Student Code";
        ws.Cell(headerRow, 2).Value = "Student Name";
        ws.Cell(headerRow, 3).Value = "Sessions Attended";
        ws.Cell(headerRow, 4).Value = "Total Sessions";
        ws.Cell(headerRow, 5).Value = "Attendance %";

        int col = 6;
        foreach (var s in sessions)
        {
            ws.Cell(headerRow, col).Value = $"{s.SessionDate:dd/MM}\n{s.Name}";
            ws.Cell(headerRow, col).Style.Alignment.WrapText = true;
            col++;
        }

        // Style header row
        var headerRange = ws.Range(headerRow, 1, headerRow, col - 1);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // ── Data rows ──
        int row = headerRow + 1;
        foreach (var student in students)
        {
            var studentAttendances = attendances.Where(a => a.StudentId == student.Id).ToList();
            int attended = studentAttendances.Count(a => a.Joined);
            double rate = sessions.Count > 0 ? Math.Round((double)attended / sessions.Count * 100, 1) : 0;

            ws.Cell(row, 1).Value = student.StudentCode ?? "—";
            ws.Cell(row, 2).Value = student.Name;
            ws.Cell(row, 3).Value = attended;
            ws.Cell(row, 4).Value = sessions.Count;

            var rateCell = ws.Cell(row, 5);
            rateCell.Value = $"{rate}%";
            rateCell.Style.Font.Bold = true;
            rateCell.Style.Font.FontColor = rate >= 75 ? XLColor.Green : rate >= 50 ? XLColor.Orange : XLColor.Red;

            col = 6;
            foreach (var s in sessions)
            {
                var att = studentAttendances.FirstOrDefault(a => a.SessionId == s.Id);
                var cell = ws.Cell(row, col);
                if (att == null) { cell.Value = "—"; cell.Style.Font.FontColor = XLColor.LightGray; }
                else if (att.Joined) { cell.Value = "✓"; cell.Style.Font.FontColor = XLColor.Green; cell.Style.Font.Bold = true; }
                else { cell.Value = "✗"; cell.Style.Font.FontColor = XLColor.Red; }
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                col++;
            }

            // Alternate row color
            if (row % 2 == 0)
                ws.Range(row, 1, row, col - 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

            row++;
        }

        // ── Summary row ──
        ws.Cell(row, 1).Value = "TOTAL";
        ws.Cell(row, 2).Value = $"{students.Count} students";
        var summaryRange = ws.Range(row, 1, row, 5);
        summaryRange.Style.Font.Bold = true;
        summaryRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#DBEAFE");

        ws.Columns().AdjustToContents();
        ws.Column(2).Width = Math.Max(ws.Column(2).Width, 25);
        ws.Column(5).Width = 14;

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        stream.Position = 0;
        var fileName = $"Attendance_{group.Name.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. GRADES REPORT  (Excel)
    //    GET /api/reports/grades?groupId=1
    // ─────────────────────────────────────────────────────────────
    [HttpGet("grades")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> GradesReport([FromQuery] int groupId)
    {
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return NotFound(new { message = "Group not found" });

        if (UserRole == "Coordinator")
        {
            var hasAccess = await _db.CoordinatorGroups
                .AnyAsync(cg => cg.CoordinatorId == UserId && cg.GroupId == groupId);
            if (!hasAccess) return Forbid();
        }

        var sessionIds = await _db.Sessions
            .Where(s => s.GroupId == groupId)
            .Select(s => s.Id)
            .ToListAsync();

        var quizzes = await _db.Quizzes
            .Where(q => q.SessionId != null && sessionIds.Contains(q.SessionId!.Value) && q.IsGraded)
            .Include(q => q.Questions)
            .Include(q => q.Session)
            .OrderBy(q => q.Session!.SessionDate)
            .ToListAsync();

        var assignments = await _db.Assignments
            .Where(a => a.SessionId != null && sessionIds.Contains(a.SessionId!.Value) && a.IsGraded)
            .Include(a => a.Session)
            .OrderBy(a => a.Session!.SessionDate)
            .ToListAsync();

        var students = await _db.StudentGroups
            .Where(sg => sg.GroupId == groupId)
            .Include(sg => sg.Student)
            .OrderBy(sg => sg.Student.Name)
            .Select(sg => new { sg.Student.Id, sg.Student.Name, sg.Student.StudentCode })
            .ToListAsync();

        var quizSubs = await _db.QuizSubmissions
            .Where(s => quizzes.Select(q => q.Id).Contains(s.QuizId))
            .ToListAsync();

        var assignSubs = await _db.AssignmentSubmissions
            .Where(s => assignments.Select(a => a.Id).Contains(s.AssignmentId))
            .ToListAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Grades");

        ws.Cell(1, 1).Value = $"Grades Report — {group.Name}";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;
        ws.Cell(2, 1).Value = $"Generated: {DateTime.Now:dd MMM yyyy HH:mm}";
        ws.Cell(2, 1).Style.Font.Italic = true;
        ws.Cell(2, 1).Style.Font.FontColor = XLColor.Gray;

        int headerRow = 4;
        ws.Cell(headerRow, 1).Value = "Student Code";
        ws.Cell(headerRow, 2).Value = "Student Name";

        int col = 3;
        var quizCols = new Dictionary<int, int>();
        foreach (var q in quizzes)
        {
            ws.Cell(headerRow, col).Value = $"Quiz\n{q.Title}\n(/{q.Questions.Sum(x => x.Points)})";
            ws.Cell(headerRow, col).Style.Alignment.WrapText = true;
            quizCols[q.Id] = col++;
        }

        var assignCols = new Dictionary<int, int>();
        foreach (var a in assignments)
        {
            ws.Cell(headerRow, col).Value = $"Assignment\n{a.Title}\n(/100)";
            ws.Cell(headerRow, col).Style.Alignment.WrapText = true;
            assignCols[a.Id] = col++;
        }

        ws.Cell(headerRow, col).Value = "Quiz Avg %";
        int quizAvgCol = col++;
        ws.Cell(headerRow, col).Value = "Assign Avg";
        int assignAvgCol = col++;
        ws.Cell(headerRow, col).Value = "Overall %";
        int overallCol = col;

        var headerRange = ws.Range(headerRow, 1, headerRow, col);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        int row = headerRow + 1;
        foreach (var student in students)
        {
            ws.Cell(row, 1).Value = student.StudentCode ?? "—";
            ws.Cell(row, 2).Value = student.Name;

            double totalQuizPts = 0, totalQuizMax = 0;
            foreach (var q in quizzes)
            {
                var sub = quizSubs.FirstOrDefault(s => s.QuizId == q.Id && s.StudentId == student.Id);
                var cell = ws.Cell(row, quizCols[q.Id]);
                int maxPts = q.Questions.Sum(x => x.Points);
                if (sub != null)
                {
                    cell.Value = sub.Score;
                    cell.Style.Font.FontColor = (double)sub.Score / maxPts >= 0.5 ? XLColor.Green : XLColor.Red;
                    totalQuizPts += sub.Score;
                    totalQuizMax += maxPts;
                }
                else { cell.Value = "—"; cell.Style.Font.FontColor = XLColor.Gray; }
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            double totalAssignGrades = 0;
            int gradedAssignCount = 0;
            foreach (var a in assignments)
            {
                var sub = assignSubs.FirstOrDefault(s => s.AssignmentId == a.Id && s.StudentId == student.Id);
                var cell = ws.Cell(row, assignCols[a.Id]);
                if (sub?.Grade != null)
                {
                    cell.Value = sub.Grade;
                    cell.Style.Font.FontColor = sub.Grade >= 50 ? XLColor.Green : XLColor.Red;
                    totalAssignGrades += sub.Grade.Value;
                    gradedAssignCount++;
                }
                else if (sub != null) { cell.Value = "Pending"; cell.Style.Font.FontColor = XLColor.Orange; }
                else { cell.Value = "—"; cell.Style.Font.FontColor = XLColor.Gray; }
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            double quizAvg = totalQuizMax > 0 ? Math.Round(totalQuizPts / totalQuizMax * 100, 1) : 0;
            double assignAvg = gradedAssignCount > 0 ? Math.Round(totalAssignGrades / gradedAssignCount, 1) : 0;
            double overall = (totalQuizMax + gradedAssignCount * 100) > 0
                ? Math.Round((totalQuizPts + totalAssignGrades) / (totalQuizMax + gradedAssignCount * 100) * 100, 1) : 0;

            ws.Cell(row, quizAvgCol).Value = $"{quizAvg}%";
            ws.Cell(row, assignAvgCol).Value = assignAvg > 0 ? $"{assignAvg}" : "—";
            var overallCell = ws.Cell(row, overallCol);
            overallCell.Value = $"{overall}%";
            overallCell.Style.Font.Bold = true;
            overallCell.Style.Font.FontColor = overall >= 75 ? XLColor.Green : overall >= 50 ? XLColor.Orange : XLColor.Red;

            if (row % 2 == 0)
                ws.Range(row, 1, row, col).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Columns().AdjustToContents();
        ws.Column(2).Width = Math.Max(ws.Column(2).Width, 25);

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        var fileName = $"Grades_{group.Name.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. GROUP SUMMARY REPORT  (Excel)
    //    GET /api/reports/group-summary?groupId=1
    // ─────────────────────────────────────────────────────────────
    [HttpGet("group-summary")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> GroupSummaryReport([FromQuery] int groupId)
    {
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return NotFound(new { message = "Group not found" });

        if (UserRole == "Coordinator")
        {
            var hasAccess = await _db.CoordinatorGroups
                .AnyAsync(cg => cg.CoordinatorId == UserId && cg.GroupId == groupId);
            if (!hasAccess) return Forbid();
        }

        var sessions = await _db.Sessions.Where(s => s.GroupId == groupId).ToListAsync();
        var sessionIds = sessions.Select(s => s.Id).ToList();
        var ranSessionIds = sessions.Where(s => s.Status == "running" || s.Status == "finished").Select(s => s.Id).ToList();

        var students = await _db.StudentGroups
            .Where(sg => sg.GroupId == groupId)
            .Include(sg => sg.Student)
            .ToListAsync();

        var attendances = await _db.Attendances.Where(a => ranSessionIds.Contains(a.SessionId)).ToListAsync();
        var quizzes = await _db.Quizzes.Where(q => q.SessionId.HasValue && sessionIds.Contains(q.SessionId.Value)).CountAsync();
        var assignments = await _db.Assignments.Where(a => a.SessionId.HasValue && sessionIds.Contains(a.SessionId.Value)).CountAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Group Summary");

        // ── Title block ──
        void StyleTitle(IXLCell c, string v, bool big = false) {
            c.Value = v; c.Style.Font.Bold = true;
            if (big) c.Style.Font.FontSize = 16;
        }

        StyleTitle(ws.Cell(1, 1), $"Group Summary Report", true);
        ws.Cell(2, 1).Value = group.Name;
        ws.Cell(2, 1).Style.Font.FontSize = 13;
        ws.Cell(2, 1).Style.Font.FontColor = XLColor.FromHtml("#2563EB");
        ws.Cell(3, 1).Value = $"Generated: {DateTime.Now:dd MMM yyyy HH:mm}";
        ws.Cell(3, 1).Style.Font.Italic = true;
        ws.Cell(3, 1).Style.Font.FontColor = XLColor.Gray;

        // ── Key Stats ──
        int r = 5;
        void StatRow(string label, object value) {
            ws.Cell(r, 1).Value = label; ws.Cell(r, 1).Style.Font.Bold = true;
            ws.Cell(r, 2).Value = value?.ToString() ?? "—";
            r++;
        }

        ws.Cell(r, 1).Value = "KEY STATISTICS";
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.FontColor = XLColor.White;
        ws.Range(r, 1, r, 4).Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
        r++;

        StatRow("Total Students", students.Count);
        StatRow("Male", students.Count(s => s.Student.Gender == "Male"));
        StatRow("Female", students.Count(s => s.Student.Gender == "Female"));
        StatRow("Total Sessions", sessions.Count);
        StatRow("Finished Sessions", sessions.Count(s => s.Status == "finished"));
        StatRow("Pending Sessions", sessions.Count(s => s.Status == "pending"));
        StatRow("Cancelled Sessions", sessions.Count(s => s.Status == "cancelled"));
        StatRow("Total Quizzes", quizzes);
        StatRow("Total Assignments", assignments);

        double overallAttendance = ranSessionIds.Count > 0 && students.Count > 0
            ? Math.Round((double)attendances.Count(a => a.Joined) / (ranSessionIds.Count * students.Count) * 100, 1)
            : 0;
        StatRow("Overall Attendance Rate", $"{overallAttendance}%");

        // ── Per-student attendance summary ──
        r += 2;
        ws.Cell(r, 1).Value = "STUDENT ATTENDANCE SUMMARY";
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.FontColor = XLColor.White;
        ws.Range(r, 1, r, 4).Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
        r++;

        ws.Cell(r, 1).Value = "Student Code";
        ws.Cell(r, 2).Value = "Name";
        ws.Cell(r, 3).Value = "Attended";
        ws.Cell(r, 4).Value = "Rate %";
        ws.Range(r, 1, r, 4).Style.Font.Bold = true;
        ws.Range(r, 1, r, 4).Style.Fill.BackgroundColor = XLColor.FromHtml("#DBEAFE");
        r++;

        foreach (var sg in students.OrderBy(s => s.Student.Name))
        {
            var att = attendances.Count(a => a.StudentId == sg.Student.Id && a.Joined);
            double rate = ranSessionIds.Count > 0 ? Math.Round((double)att / ranSessionIds.Count * 100, 1) : 0;
            ws.Cell(r, 1).Value = sg.Student.StudentCode ?? "—";
            ws.Cell(r, 2).Value = sg.Student.Name;
            ws.Cell(r, 3).Value = $"{att}/{ranSessionIds.Count}";
            var rateCell = ws.Cell(r, 4);
            rateCell.Value = $"{rate}%";
            rateCell.Style.Font.FontColor = rate >= 75 ? XLColor.Green : rate >= 50 ? XLColor.Orange : XLColor.Red;
            if (r % 2 == 0) ws.Range(r, 1, r, 4).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            r++;
        }

        ws.Columns().AdjustToContents();
        ws.Column(2).Width = Math.Max(ws.Column(2).Width, 28);

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        var fileName = $"GroupSummary_{group.Name.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. STUDENT PROGRESS REPORT  (PDF)
    //    GET /api/reports/student-progress
    //    Students call this for themselves; Admin/Coordinator pass ?studentId=
    // ─────────────────────────────────────────────────────────────
    [HttpGet("student-progress")]
    public async Task<IActionResult> StudentProgressReport([FromQuery] int? studentId)
    {
        int targetId;
        if (UserRole == "Student")
            targetId = UserId;
        else if (studentId.HasValue)
            targetId = studentId.Value;
        else
            return BadRequest(new { message = "Provide studentId" });

        var student = await _db.Users.FindAsync(targetId);
        if (student == null) return NotFound(new { message = "Student not found" });

        var groupId = await _db.StudentGroups
            .Where(sg => sg.StudentId == targetId)
            .Select(sg => sg.GroupId)
            .FirstOrDefaultAsync();

        var group = groupId > 0 ? await _db.Groups.FindAsync(groupId) : null;

        var sessionIds = group != null
            ? await _db.Sessions.Where(s => s.GroupId == group.Id && (s.Status == "running" || s.Status == "finished")).Select(s => s.Id).ToListAsync()
            : new List<int>();

        var allSessionIds = group != null
            ? await _db.Sessions.Where(s => s.GroupId == group.Id).Select(s => s.Id).ToListAsync()
            : new List<int>();

        int attended = await _db.Attendances.CountAsync(a => a.StudentId == targetId && a.Joined && sessionIds.Contains(a.SessionId));
        double attRate = sessionIds.Count > 0 ? Math.Round((double)attended / sessionIds.Count * 100, 1) : 0;

        var quizSubs = await _db.QuizSubmissions
            .Where(s => s.StudentId == targetId)
            .Include(s => s.Quiz).ThenInclude(q => q.Session)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(20)
            .ToListAsync();

        var assignSubs = await _db.AssignmentSubmissions
            .Where(s => s.StudentId == targetId)
            .Include(s => s.Assignment).ThenInclude(a => a!.Session)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(20)
            .ToListAsync();

        double quizPtsObtained = quizSubs.Sum(s => s.Score);
        double quizPtsTotal = quizSubs.Sum(s => s.TotalPoints);
        double quizAvg = quizPtsTotal > 0 ? Math.Round(quizPtsObtained / quizPtsTotal * 100, 1) : 0;

        var gradedAssigns = assignSubs.Where(s => s.Grade.HasValue).ToList();
        double assignAvg = gradedAssigns.Any() ? Math.Round(gradedAssigns.Average(s => s.Grade!.Value), 1) : 0;

        double totalPtsObtained = quizPtsObtained + gradedAssigns.Sum(s => s.Grade!.Value);
        double totalPtsPossible = quizPtsTotal + gradedAssigns.Count * 100;
        double overallPct = totalPtsPossible > 0 ? Math.Round(totalPtsObtained / totalPtsPossible * 100, 1) : 0;

        // ── Build PDF ──
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(35);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("LMS Pro").FontSize(20).Bold().FontColor(Color.FromHex("2563EB"));
                            c.Item().Text("Student Progress Report").FontSize(13).FontColor(Color.FromHex("64748B"));
                        });
                        row.ConstantItem(120).AlignRight().Column(c =>
                        {
                            c.Item().Text($"Generated").FontSize(8).FontColor(Color.FromHex("94A3B8"));
                            c.Item().Text(DateTime.Now.ToString("dd MMM yyyy")).FontSize(9).FontColor(Color.FromHex("64748B"));
                        });
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor(Color.FromHex("2563EB"));
                });

                page.Content().PaddingTop(16).Column(col =>
                {
                    // ── Student info ──
                    col.Item().Background(Color.FromHex("EFF6FF")).Padding(14).Border(1).BorderColor(Color.FromHex("BFDBFE")).Column(info =>
                    {
                        info.Item().Text(student.Name).FontSize(16).Bold().FontColor(Color.FromHex("1E293B"));
                        info.Item().PaddingTop(4).Row(r =>
                        {
                            r.RelativeItem().Text($"Code: {student.StudentCode ?? "—"}").FontColor(Color.FromHex("64748B"));
                            r.RelativeItem().Text($"Email: {student.Email}").FontColor(Color.FromHex("64748B"));
                            r.RelativeItem().Text($"Group: {group?.Name ?? "—"}").FontColor(Color.FromHex("64748B"));
                        });
                    });

                    col.Item().PaddingTop(16);

                    // ── Score overview cards ──
                    col.Item().Text("Performance Overview").FontSize(12).Bold().FontColor(Color.FromHex("1E293B"));
                    col.Item().PaddingTop(8).Row(r =>
                    {
                        void Card(string label, string value, string color) =>
                            r.RelativeItem().Padding(4).Border(1).BorderColor(Color.FromHex("E2E8F0"))
                             .Background(Color.FromHex("F8FAFC")).Padding(10).Column(c =>
                             {
                                 c.Item().Text(value).FontSize(22).Bold().FontColor(Color.FromHex(color));
                                 c.Item().PaddingTop(2).Text(label).FontSize(9).FontColor(Color.FromHex("64748B"));
                             });
                        Card("Overall Score", $"{overallPct}%", overallPct >= 75 ? "16A34A" : overallPct >= 50 ? "D97706" : "DC2626");
                        Card("Attendance Rate", $"{attRate}%", attRate >= 75 ? "16A34A" : attRate >= 50 ? "D97706" : "DC2626");
                        Card("Quiz Average", $"{quizAvg}%", quizAvg >= 75 ? "16A34A" : quizAvg >= 50 ? "D97706" : "DC2626");
                        Card("Assignment Avg", assignAvg > 0 ? $"{assignAvg}" : "—", assignAvg >= 75 ? "16A34A" : assignAvg >= 50 ? "D97706" : "64748B");
                    });

                    // ── Attendance ──
                    col.Item().PaddingTop(16).Text("Attendance").FontSize(12).Bold().FontColor(Color.FromHex("1E293B"));
                    col.Item().PaddingTop(6).Background(Color.FromHex("F8FAFC")).Border(1).BorderColor(Color.FromHex("E2E8F0")).Padding(10).Row(r =>
                    {
                        r.RelativeItem().Text($"Sessions Attended: {attended} / {sessionIds.Count}").FontColor(Color.FromHex("1E293B"));
                        r.ConstantItem(100).Text($"{attRate}%").Bold()
                            .FontColor(Color.FromHex(attRate >= 75 ? "16A34A" : attRate >= 50 ? "D97706" : "DC2626"));
                    });

                    // ── Quiz results table ──
                    if (quizSubs.Any())
                    {
                        col.Item().PaddingTop(16).Text("Quiz Results").FontSize(12).Bold().FontColor(Color.FromHex("1E293B"));

                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(3);
                                c.RelativeColumn(2);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                            });

                            table.Header(header =>
                            {
                                void TH(string t)
                                {
                                    header.Cell().Background(Color.FromHex("2563EB"))
                                        .Padding(6)
                                        .Text(t)
                                        .FontSize(9)
                                        .Bold()
                                        .FontColor(Colors.White);
                                }

                                TH("Quiz");
                                TH("Session");
                                TH("Score");
                                TH("Max");
                                TH("%");
                            });

                            bool alt = false;

                            foreach (var s in quizSubs)
                            {
                                var bg = alt ? Color.FromHex("F8FAFC") : Colors.White;
                                double pct = s.TotalPoints > 0
                                    ? Math.Round((double)s.Score / s.TotalPoints * 100, 0)
                                    : 0;

                                void TD(string t, bool bold = false, string? color = null)
                                {
                                    var text = table.Cell()
                                        .Background(bg)
                                        .Padding(5)
                                        .Text(t)
                                        .FontSize(9);

                                    if (bold)
                                        text.Bold();

                                    text.FontColor(color != null ? Color.FromHex(color) : Color.FromHex("1E293B"));
                                }

                                TD(s.Quiz?.Title ?? "—");
                                TD(s.Quiz?.Session?.Name ?? "—");
                                TD(s.Score.ToString(), true);
                                TD(s.TotalPoints.ToString());
                                TD($"{pct}%", true, pct >= 75 ? "16A34A" : pct >= 50 ? "D97706" : "DC2626");

                                alt = !alt;
                            }
                        });
                    }

                    if (assignSubs.Any())
                    {
                        col.Item().PaddingTop(16).Text("Assignment Results").FontSize(12).Bold().FontColor(Color.FromHex("1E293B"));

                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(3);
                                c.RelativeColumn(2);
                                c.RelativeColumn(1);
                                c.RelativeColumn(3);
                            });

                            table.Header(header =>
                            {
                                void TH(string t)
                                {
                                    header.Cell().Background(Color.FromHex("2563EB"))
                                        .Padding(6)
                                        .Text(t)
                                        .FontSize(9)
                                        .Bold()
                                        .FontColor(Colors.White);
                                }

                                TH("Assignment");
                                TH("Session");
                                TH("Grade");
                                TH("Feedback");
                            });

                            bool alt = false;

                            foreach (var s in assignSubs)
                            {
                                var bg = alt ? Color.FromHex("F8FAFC") : Colors.White;

                                void TD(string t, bool bold = false, string? color = null)
                                {
                                    var text = table.Cell()
                                        .Background(bg)
                                        .Padding(5)
                                        .Text(t)
                                        .FontSize(9);

                                    if (bold)
                                        text.Bold();

                                    text.FontColor(color != null ? Color.FromHex(color) : Color.FromHex("1E293B"));
                                }

                                TD(s.Assignment?.Title ?? "—");
                                TD(s.Assignment?.Session?.Name ?? "—");
                                TD(
                                    s.Grade.HasValue ? s.Grade.Value.ToString() : "Pending",
                                    true,
                                    s.Grade.HasValue
                                        ? (s.Grade >= 75 ? "16A34A" : s.Grade >= 50 ? "D97706" : "DC2626")
                                        : "D97706"
                                );
                                TD(s.GradeFeedback ?? "—");

                                alt = !alt;
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("LMS Pro — Confidential Report  |  Page ").FontSize(8).FontColor(Color.FromHex("94A3B8"));
                    t.CurrentPageNumber().FontSize(8).FontColor(Color.FromHex("94A3B8"));
                    t.Span(" of ").FontSize(8).FontColor(Color.FromHex("94A3B8"));
                    t.TotalPages().FontSize(8).FontColor(Color.FromHex("94A3B8"));
                });
            });
        });

        var pdf = doc.GeneratePdf();
        var fileName = $"Progress_{student.Name.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.pdf";
        return File(pdf, "application/pdf", fileName);
    }
}
