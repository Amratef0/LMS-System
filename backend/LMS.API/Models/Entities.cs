namespace LMS.API.Models;

public class Instructor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Session> TrainedSessions { get; set; } = new List<Session>();
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public string? Phone { get; set; }
    public string? NationalId { get; set; }
    public string? City { get; set; }
    public string? Gender { get; set; }
    public string? StudentCode { get; set; } // unique code for students
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CoordinatorGroup> CoordinatorGroups { get; set; } = new List<CoordinatorGroup>();
    public ICollection<StudentGroup> StudentGroups { get; set; } = new List<StudentGroup>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<QuizSubmission> QuizSubmissions { get; set; } = new List<QuizSubmission>();
    public ICollection<AssignmentSubmission> AssignmentSubmissions { get; set; } = new List<AssignmentSubmission>();
}

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CoordinatorGroup> CoordinatorGroups { get; set; } = new List<CoordinatorGroup>();
    public ICollection<StudentGroup> StudentGroups { get; set; } = new List<StudentGroup>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}

public class CoordinatorGroup
{
    public int Id { get; set; }
    public int CoordinatorId { get; set; }
    public User Coordinator { get; set; } = null!;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class StudentGroup
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public int? TeamLeadId { get; set; }
    public User? TeamLead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
}

public class TeamMember
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
}

public class Session
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TrainerId { get; set; }
    public Instructor Trainer { get; set; } = null!;
    public DateTime SessionDate { get; set; }
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public string Type { get; set; } = "live";
    public string Topic { get; set; } = "technical";
    public string Status { get; set; } = "pending";
    public string? RecordLink { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? StartedById { get; set; }
    public User? StartedBy { get; set; }
    public DateTime? StartedAt { get; set; }
    public int? EndedById { get; set; }
    public User? EndedBy { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? AttendanceTakenById { get; set; }
    public User? AttendanceTakenBy { get; set; }
    public DateTime? AttendanceTakenAt { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<SessionAttachment> Attachments { get; set; } = new List<SessionAttachment>();
}

public class SessionAttachment
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? Link { get; set; }
    public string AttachmentType { get; set; } = "link"; // link, pdf
    public int UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Attendance
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public bool Joined { get; set; } = false;
    public DateTime? JoinedAt { get; set; }
}

public class Quiz
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "multiple_choice";
    public bool IsGraded { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public int? SessionId { get; set; }
    public Session? Session { get; set; }
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    public ICollection<QuizSubmission> Submissions { get; set; } = new List<QuizSubmission>();
}

public class QuizQuestion
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public string QuestionText { get; set; } = string.Empty;
    public string? OptionA { get; set; }
    public string? OptionB { get; set; }
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public string CorrectAnswer { get; set; } = "A";
    public int Points { get; set; } = 1;
    public int Order { get; set; }
}

public class QuizSubmission
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? Answers { get; set; } // JSON
}

public class Assignment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsGraded { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public int? SessionId { get; set; }
    public Session? Session { get; set; }
    public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
}

public class AssignmentSubmission
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public string? FileUrl { get; set; }
    public string? Link { get; set; }
    public string SubmissionType { get; set; } = "file"; // file, link
    public string? Notes { get; set; }
    public int? Grade { get; set; }
    public string? GradeFeedback { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "in_progress";
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<TicketReply> Replies { get; set; } = new List<TicketReply>();
}

public class TicketReply
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Survey
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? SessionId { get; set; }
    public Session? Session { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SurveySubmission> Submissions { get; set; } = new List<SurveySubmission>();
}

public class SurveySubmission
{
    public int Id { get; set; }
    public int SurveyId { get; set; }
    public Survey Survey { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public decimal Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
