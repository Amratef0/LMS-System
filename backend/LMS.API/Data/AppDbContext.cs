using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using LMS.API.Models;

namespace LMS.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<CoordinatorGroup> CoordinatorGroups => Set<CoordinatorGroup>();
    public DbSet<StudentGroup> StudentGroups => Set<StudentGroup>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionAttachment> SessionAttachments => Set<SessionAttachment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizSubmission> QuizSubmissions => Set<QuizSubmission>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<AssignmentSubmission> AssignmentSubmissions => Set<AssignmentSubmission>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketReply> TicketReplies => Set<TicketReply>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveySubmission> SurveySubmissions => Set<SurveySubmission>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── Force every DateTime stored in / read from SQL Server to be treated as UTC. ──
        // SQL Server's datetime2 columns have no concept of timezone, so EF Core loses the
        // DateTime.Kind on round-trip (it comes back as Unspecified). When System.Text.Json
        // then serializes an "Unspecified" DateTime it omits the trailing 'Z', and the
        // browser's `new Date(...)` misreads that as local time instead of UTC — causing a
        // timezone double-shift (e.g. exactly 3 hours off for someone in Africa/Cairo).
        // This converter guarantees Kind=Utc on write and on read, for every entity.
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in mb.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(utcConverter);
                else if (property.ClrType == typeof(DateTime?))
                    property.SetValueConverter(nullableUtcConverter);
            }
        }

        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();
        mb.Entity<User>().HasIndex(u => u.StudentCode).IsUnique().HasFilter("[StudentCode] IS NOT NULL");
        mb.Entity<Group>().HasIndex(g => g.Code).IsUnique();

        mb.Entity<CoordinatorGroup>()
            .HasOne(cg => cg.Coordinator).WithMany(u => u.CoordinatorGroups).HasForeignKey(cg => cg.CoordinatorId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<CoordinatorGroup>()
            .HasOne(cg => cg.Group).WithMany(g => g.CoordinatorGroups).HasForeignKey(cg => cg.GroupId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<StudentGroup>()
            .HasOne(sg => sg.Student).WithMany(u => u.StudentGroups).HasForeignKey(sg => sg.StudentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<StudentGroup>()
            .HasOne(sg => sg.Group).WithMany(g => g.StudentGroups).HasForeignKey(sg => sg.GroupId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Session>()
            .HasOne(s => s.Trainer).WithMany(u => u.TrainedSessions).HasForeignKey(s => s.TrainerId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Session>()
            .HasOne(s => s.StartedBy).WithMany().HasForeignKey(s => s.StartedById).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Session>()
            .HasOne(s => s.EndedBy).WithMany().HasForeignKey(s => s.EndedById).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Session>()
            .HasOne(s => s.AttendanceTakenBy).WithMany().HasForeignKey(s => s.AttendanceTakenById).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<SessionAttachment>()
            .HasOne(sa => sa.UploadedBy).WithMany().HasForeignKey(sa => sa.UploadedById).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Attendance>()
            .HasOne(a => a.Student).WithMany(u => u.Attendances).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<QuizSubmission>()
            .HasOne(qs => qs.Student).WithMany(u => u.QuizSubmissions).HasForeignKey(qs => qs.StudentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<AssignmentSubmission>()
            .HasOne(a => a.Student).WithMany(u => u.AssignmentSubmissions).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Ticket>()
            .HasOne(t => t.Student).WithMany(u => u.Tickets).HasForeignKey(t => t.StudentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<TicketReply>()
            .HasOne(tr => tr.User).WithMany().HasForeignKey(tr => tr.UserId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Team>()
            .HasOne(t => t.TeamLead).WithMany().HasForeignKey(t => t.TeamLeadId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<TeamMember>()
            .HasOne(tm => tm.Student).WithMany().HasForeignKey(tm => tm.StudentId).OnDelete(DeleteBehavior.Restrict);

        SeedData(mb);
    }

private static void SeedData(ModelBuilder mb)
{
    var adminPass   = BCrypt.Net.BCrypt.HashPassword("Admin@456");
    var coordPass   = BCrypt.Net.BCrypt.HashPassword("Coord@456");
    var studentPass = BCrypt.Net.BCrypt.HashPassword("Student@456");

    // =========================================================
    // USERS
    // =========================================================

    mb.Entity<User>().HasData(
        new User
        {
            Id = 1,
            Name = "System Administrator",
            Email = "admin@learnhub.test",
            PasswordHash = adminPass,
            Role = "Admin",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 2,
            Name = "Youssef Nabil",
            Email = "youssef.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01023456781",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 3,
            Name = "Mariam Adel",
            Email = "mariam.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01134567892",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 4,
            Name = "Karim Mostafa",
            Email = "karim.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01245678903",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 5,
            Name = "Nadine Sameh",
            Email = "nadine.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01556789014",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 6,
            Name = "Omar Tarek",
            Email = "omar.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01667890125",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 7,
            Name = "Laila Hassan",
            Email = "laila.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01778901236",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        new User
        {
            Id = 8,
            Name = "Ziad Fathy",
            Email = "ziad.coordinator@learnhub.test",
            PasswordHash = coordPass,
            Role = "Coordinator",
            Phone = "01089012347",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 5)
        },

        // Students
        new User
        {
            Id = 9,
            Name = "Hana Mahmoud",
            Email = "hana.mahmoud@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1001",
            Phone = "01011122334",
            NationalId = "29901011223344",
            City = "Cairo",
            Gender = "Female",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 10,
            Name = "Adam Sherif",
            Email = "adam.sherif@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1002",
            Phone = "01122233445",
            NationalId = "30002022334455",
            City = "Giza",
            Gender = "Male",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 11,
            Name = "Jana Khaled",
            Email = "jana.khaled@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1003",
            Phone = "01233344556",
            NationalId = "30103033445566",
            City = "Alexandria",
            Gender = "Female",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 12,
            Name = "Yassin Hossam",
            Email = "yassin.hossam@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1004",
            Phone = "01544455667",
            NationalId = "30204044556677",
            City = "Cairo",
            Gender = "Male",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 13,
            Name = "Malak Ahmed",
            Email = "malak.ahmed@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1005",
            Phone = "01655566778",
            NationalId = "30305055667788",
            City = "Giza",
            Gender = "Female",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 14,
            Name = "Seif Wael",
            Email = "seif.wael@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1006",
            Phone = "01766677889",
            NationalId = "30406066778899",
            City = "Mansoura",
            Gender = "Male",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 15,
            Name = "Rana Ehab",
            Email = "rana.ehab@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1007",
            Phone = "01077788990",
            NationalId = "30507077889900",
            City = "Tanta",
            Gender = "Female",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 16,
            Name = "Mohamed Hany",
            Email = "mohamed.hany@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1008",
            Phone = "01188899001",
            NationalId = "30608088990011",
            City = "Cairo",
            Gender = "Male",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 17,
            Name = "Salma Emad",
            Email = "salma.emad@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1009",
            Phone = "01299900112",
            NationalId = "30709099001122",
            City = "Ismailia",
            Gender = "Female",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        },

        new User
        {
            Id = 18,
            Name = "Mostafa Reda",
            Email = "mostafa.reda@learnhub.test",
            PasswordHash = studentPass,
            Role = "Student",
            StudentCode = "LH-1010",
            Phone = "01510011223",
            NationalId = "30810100112233",
            City = "Suez",
            Gender = "Male",
            IsActive = true,
            CreatedAt = new DateTime(2026, 2, 1)
        }
    );


    // =========================================================
    // INSTRUCTORS
    // =========================================================

    mb.Entity<Instructor>().HasData(
        new Instructor
        {
            Id = 1,
            Name = "Omar Abdelrahman",
            Email = "omar.instructor@learnhub.test",
            Phone = "01032145678",
            Bio = "Backend Development Instructor",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 10)
        },

        new Instructor
        {
            Id = 2,
            Name = "Dina Ashraf",
            Email = "dina.instructor@learnhub.test",
            Phone = "01143256789",
            Bio = "Communication and Career Skills Instructor",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 10)
        },

        new Instructor
        {
            Id = 3,
            Name = "Mahmoud Samir",
            Email = "mahmoud.instructor@learnhub.test",
            Phone = "01254367890",
            Bio = "Cloud Computing Instructor",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 10)
        },

        new Instructor
        {
            Id = 4,
            Name = "Nada Ibrahim",
            Email = "nada.instructor@learnhub.test",
            Phone = "01565478901",
            Bio = "Frontend Development Instructor",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 10)
        },

        new Instructor
        {
            Id = 5,
            Name = "Khaled Magdy",
            Email = "khaled.instructor@learnhub.test",
            Phone = "01676589012",
            Bio = "DevOps and Automation Instructor",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 10)
        }
    );


    // =========================================================
    // GROUPS
    // =========================================================

    mb.Entity<Group>().HasData(
        new Group
        {
            Id = 1,
            Name = "CAI5_WEB_A1",
            Code = "CAI5_WEB_A1",
            StartDate = new DateTime(2026, 2, 7),
            EndDate = new DateTime(2026, 8, 7),
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 20)
        },

        new Group
        {
            Id = 2,
            Name = "GIZ5_CLOUD_B2",
            Code = "GIZ5_CLOUD_B2",
            StartDate = new DateTime(2026, 2, 14),
            EndDate = new DateTime(2026, 8, 14),
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 20)
        },

        new Group
        {
            Id = 3,
            Name = "CAI5_DATA_C1",
            Code = "CAI5_DATA_C1",
            StartDate = new DateTime(2026, 2, 21),
            EndDate = new DateTime(2026, 8, 21),
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 20)
        },

        new Group
        {
            Id = 4,
            Name = "ONL5_DEVOPS_D1",
            Code = "ONL5_DEVOPS_D1",
            StartDate = new DateTime(2026, 3, 1),
            EndDate = new DateTime(2026, 9, 1),
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 20)
        }
    );


    // =========================================================
    // COORDINATOR GROUPS
    // =========================================================

    mb.Entity<CoordinatorGroup>().HasData(
        new CoordinatorGroup
        {
            Id = 1,
            CoordinatorId = 2,
            GroupId = 1,
            AssignedAt = new DateTime(2026, 1, 25)
        },

        new CoordinatorGroup
        {
            Id = 2,
            CoordinatorId = 3,
            GroupId = 2,
            AssignedAt = new DateTime(2026, 1, 25)
        },

        new CoordinatorGroup
        {
            Id = 3,
            CoordinatorId = 4,
            GroupId = 3,
            AssignedAt = new DateTime(2026, 1, 25)
        },

        new CoordinatorGroup
        {
            Id = 4,
            CoordinatorId = 5,
            GroupId = 4,
            AssignedAt = new DateTime(2026, 1, 25)
        }
    );


    // =========================================================
    // STUDENT GROUPS
    // =========================================================

    mb.Entity<StudentGroup>().HasData(
        new StudentGroup
        {
            Id = 1,
            StudentId = 9,
            GroupId = 1,
            JoinedAt = new DateTime(2026, 2, 7)
        },

        new StudentGroup
        {
            Id = 2,
            StudentId = 10,
            GroupId = 1,
            JoinedAt = new DateTime(2026, 2, 7)
        },

        new StudentGroup
        {
            Id = 3,
            StudentId = 11,
            GroupId = 1,
            JoinedAt = new DateTime(2026, 2, 8)
        },

        new StudentGroup
        {
            Id = 4,
            StudentId = 12,
            GroupId = 2,
            JoinedAt = new DateTime(2026, 2, 14)
        },

        new StudentGroup
        {
            Id = 5,
            StudentId = 13,
            GroupId = 2,
            JoinedAt = new DateTime(2026, 2, 14)
        },

        new StudentGroup
        {
            Id = 6,
            StudentId = 14,
            GroupId = 2,
            JoinedAt = new DateTime(2026, 2, 15)
        },

        new StudentGroup
        {
            Id = 7,
            StudentId = 15,
            GroupId = 3,
            JoinedAt = new DateTime(2026, 2, 21)
        },

        new StudentGroup
        {
            Id = 8,
            StudentId = 16,
            GroupId = 3,
            JoinedAt = new DateTime(2026, 2, 21)
        },

        new StudentGroup
        {
            Id = 9,
            StudentId = 17,
            GroupId = 4,
            JoinedAt = new DateTime(2026, 3, 1)
        },

        new StudentGroup
        {
            Id = 10,
            StudentId = 18,
            GroupId = 4,
            JoinedAt = new DateTime(2026, 3, 1)
        }
    );


    // =========================================================
    // SESSIONS
    // =========================================================

    mb.Entity<Session>().HasData(
        new Session
        {
            Id = 1,
            Name = "Week 1 - Backend Fundamentals",
            TrainerId = 1,
            SessionDate = new DateTime(2026, 2, 7, 10, 0, 0),
            GroupId = 1,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/backend-01",
            CreatedAt = new DateTime(2026, 2, 5),
            StartedById = 2,
            StartedAt = new DateTime(2026, 2, 7, 10, 0, 0),
            EndedById = 2,
            EndedAt = new DateTime(2026, 2, 7, 12, 0, 0),
            AttendanceTakenById = 2,
            AttendanceTakenAt = new DateTime(2026, 2, 7, 12, 10, 0)
        },

        new Session
        {
            Id = 2,
            Name = "Week 1 - Communication Skills",
            TrainerId = 2,
            SessionDate = new DateTime(2026, 2, 9, 18, 0, 0),
            GroupId = 1,
            Type = "live",
            Topic = "soft skill",
            Status = "finished",
            RecordLink = "https://example.com/recording/communication-01",
            CreatedAt = new DateTime(2026, 2, 8),
            StartedById = 2,
            StartedAt = new DateTime(2026, 2, 9, 18, 0, 0),
            EndedById = 2,
            EndedAt = new DateTime(2026, 2, 9, 20, 0, 0),
            AttendanceTakenById = 2,
            AttendanceTakenAt = new DateTime(2026, 2, 9, 20, 10, 0)
        },

        new Session
        {
            Id = 3,
            Name = "Week 2 - REST APIs",
            TrainerId = 1,
            SessionDate = new DateTime(2026, 2, 11, 18, 0, 0),
            GroupId = 1,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/api-01",
            CreatedAt = new DateTime(2026, 2, 10),
            StartedById = 2,
            StartedAt = new DateTime(2026, 2, 11, 18, 0, 0),
            EndedById = 2,
            EndedAt = new DateTime(2026, 2, 11, 20, 0, 0),
            AttendanceTakenById = 2,
            AttendanceTakenAt = new DateTime(2026, 2, 11, 20, 10, 0)
        },

        new Session
        {
            Id = 4,
            Name = "Week 1 - Cloud Introduction",
            TrainerId = 3,
            SessionDate = new DateTime(2026, 2, 14, 11, 0, 0),
            GroupId = 2,
            Type = "physical",
            Topic = "technical",
            Status = "finished",
            Location = "Giza Learning Center - Room 104",
            CreatedAt = new DateTime(2026, 2, 12),
            StartedById = 3,
            StartedAt = new DateTime(2026, 2, 14, 11, 0, 0),
            EndedById = 3,
            EndedAt = new DateTime(2026, 2, 14, 13, 0, 0),
            AttendanceTakenById = 3,
            AttendanceTakenAt = new DateTime(2026, 2, 14, 13, 10, 0)
        },

        new Session
        {
            Id = 5,
            Name = "Week 1 - Cloud Services",
            TrainerId = 3,
            SessionDate = new DateTime(2026, 2, 16, 18, 0, 0),
            GroupId = 2,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/cloud-01",
            CreatedAt = new DateTime(2026, 2, 15),
            StartedById = 3,
            StartedAt = new DateTime(2026, 2, 16, 18, 0, 0),
            EndedById = 3,
            EndedAt = new DateTime(2026, 2, 16, 20, 0, 0),
            AttendanceTakenById = 3,
            AttendanceTakenAt = new DateTime(2026, 2, 16, 20, 10, 0)
        },

        new Session
        {
            Id = 6,
            Name = "Week 2 - Database Fundamentals",
            TrainerId = 1,
            SessionDate = new DateTime(2026, 2, 23, 18, 0, 0),
            GroupId = 2,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/database-01",
            CreatedAt = new DateTime(2026, 2, 22),
            StartedById = 3,
            StartedAt = new DateTime(2026, 2, 23, 18, 0, 0),
            EndedById = 3,
            EndedAt = new DateTime(2026, 2, 23, 20, 0, 0),
            AttendanceTakenById = 3,
            AttendanceTakenAt = new DateTime(2026, 2, 23, 20, 10, 0)
        },

        new Session
        {
            Id = 7,
            Name = "Week 1 - Data Analysis",
            TrainerId = 4,
            SessionDate = new DateTime(2026, 2, 21, 14, 0, 0),
            GroupId = 3,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/data-01",
            CreatedAt = new DateTime(2026, 2, 20),
            StartedById = 4,
            StartedAt = new DateTime(2026, 2, 21, 14, 0, 0),
            EndedById = 4,
            EndedAt = new DateTime(2026, 2, 21, 16, 0, 0),
            AttendanceTakenById = 4,
            AttendanceTakenAt = new DateTime(2026, 2, 21, 16, 10, 0)
        },

        new Session
        {
            Id = 8,
            Name = "Week 2 - Data Visualization",
            TrainerId = 4,
            SessionDate = new DateTime(2026, 2, 24, 18, 0, 0),
            GroupId = 3,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/data-02",
            CreatedAt = new DateTime(2026, 2, 23),
            StartedById = 4,
            StartedAt = new DateTime(2026, 2, 24, 18, 0, 0),
            EndedById = 4,
            EndedAt = new DateTime(2026, 2, 24, 20, 0, 0),
            AttendanceTakenById = 4,
            AttendanceTakenAt = new DateTime(2026, 2, 24, 20, 10, 0)
        },

        new Session
        {
            Id = 9,
            Name = "Week 1 - DevOps Basics",
            TrainerId = 5,
            SessionDate = new DateTime(2026, 3, 1, 17, 0, 0),
            GroupId = 4,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/devops-01",
            CreatedAt = new DateTime(2026, 2, 28),
            StartedById = 5,
            StartedAt = new DateTime(2026, 3, 1, 17, 0, 0),
            EndedById = 5,
            EndedAt = new DateTime(2026, 3, 1, 19, 0, 0),
            AttendanceTakenById = 5,
            AttendanceTakenAt = new DateTime(2026, 3, 1, 19, 10, 0)
        },

        new Session
        {
            Id = 10,
            Name = "Week 2 - CI/CD Pipelines",
            TrainerId = 5,
            SessionDate = new DateTime(2026, 3, 4, 18, 0, 0),
            GroupId = 4,
            Type = "live",
            Topic = "technical",
            Status = "finished",
            RecordLink = "https://example.com/recording/devops-02",
            CreatedAt = new DateTime(2026, 3, 3),
            StartedById = 5,
            StartedAt = new DateTime(2026, 3, 4, 18, 0, 0),
            EndedById = 5,
            EndedAt = new DateTime(2026, 3, 4, 20, 0, 0),
            AttendanceTakenById = 5,
            AttendanceTakenAt = new DateTime(2026, 3, 4, 20, 10, 0)
        },

        new Session
        {
            Id = 11,
            Name = "Week 3 - Docker Workshop",
            TrainerId = 5,
            SessionDate = new DateTime(2026, 3, 8, 17, 0, 0),
            GroupId = 4,
            Type = "live",
            Topic = "technical",
            Status = "pending",
            CreatedAt = new DateTime(2026, 3, 5)
        },

        new Session
        {
            Id = 12,
            Name = "Week 8 - Final Project Workshop",
            TrainerId = 1,
            SessionDate = new DateTime(2026, 4, 18, 11, 0, 0),
            GroupId = 1,
            Type = "physical",
            Topic = "technical",
            Status = "finished",
            Location = "Cairo Innovation Center - Lab 3",
            CreatedAt = new DateTime(2026, 4, 15),
            StartedById = 2,
            StartedAt = new DateTime(2026, 4, 18, 11, 0, 0),
            EndedById = 2,
            EndedAt = new DateTime(2026, 4, 18, 14, 0, 0),
            AttendanceTakenById = 2,
            AttendanceTakenAt = new DateTime(2026, 4, 18, 14, 10, 0)
        }
    );


    // =========================================================
    // SESSION ATTACHMENTS
    // =========================================================

    mb.Entity<SessionAttachment>().HasData(
        new SessionAttachment
        {
            Id = 1,
            SessionId = 1,
            Title = "Backend Fundamentals Slides",
            AttachmentType = "pdf",
            FileUrl = "https://example.com/files/backend-fundamentals.pdf",
            UploadedById = 2,
            CreatedAt = new DateTime(2026, 2, 7)
        },

        new SessionAttachment
        {
            Id = 2,
            SessionId = 4,
            Title = "Cloud Computing Notes",
            AttachmentType = "pdf",
            FileUrl = "https://example.com/files/cloud-notes.pdf",
            UploadedById = 3,
            CreatedAt = new DateTime(2026, 2, 14)
        },

        new SessionAttachment
        {
            Id = 3,
            SessionId = 9,
            Title = "DevOps Practice Guide",
            AttachmentType = "pdf",
            FileUrl = "https://example.com/files/devops-guide.pdf",
            UploadedById = 5,
            CreatedAt = new DateTime(2026, 3, 1)
        }
    );


    // =========================================================
    // ATTENDANCE
    // =========================================================

    mb.Entity<Attendance>().HasData(
        new Attendance
        {
            Id = 1,
            SessionId = 1,
            StudentId = 9,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 7, 10, 3, 0)
        },

        new Attendance
        {
            Id = 2,
            SessionId = 1,
            StudentId = 10,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 7, 10, 7, 0)
        },

        new Attendance
        {
            Id = 3,
            SessionId = 1,
            StudentId = 11,
            Joined = false
        },

        new Attendance
        {
            Id = 4,
            SessionId = 2,
            StudentId = 9,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 9, 18, 4, 0)
        },

        new Attendance
        {
            Id = 5,
            SessionId = 2,
            StudentId = 10,
            Joined = false
        },

        new Attendance
        {
            Id = 6,
            SessionId = 2,
            StudentId = 11,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 9, 18, 12, 0)
        },

        new Attendance
        {
            Id = 7,
            SessionId = 4,
            StudentId = 12,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 14, 11, 2, 0)
        },

        new Attendance
        {
            Id = 8,
            SessionId = 4,
            StudentId = 13,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 14, 11, 5, 0)
        },

        new Attendance
        {
            Id = 9,
            SessionId = 4,
            StudentId = 14,
            Joined = false
        },

        new Attendance
        {
            Id = 10,
            SessionId = 7,
            StudentId = 15,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 21, 14, 6, 0)
        },

        new Attendance
        {
            Id = 11,
            SessionId = 7,
            StudentId = 16,
            Joined = true,
            JoinedAt = new DateTime(2026, 2, 21, 14, 3, 0)
        },

        new Attendance
        {
            Id = 12,
            SessionId = 9,
            StudentId = 17,
            Joined = true,
            JoinedAt = new DateTime(2026, 3, 1, 17, 4, 0)
        },

        new Attendance
        {
            Id = 13,
            SessionId = 9,
            StudentId = 18,
            Joined = false
        }
    );


    // =========================================================
    // QUIZZES
    // =========================================================

    mb.Entity<Quiz>().HasData(
        new Quiz
        {
            Id = 1,
            Title = "Backend API Fundamentals Quiz",
            Type = "multiple_choice",
            IsGraded = true,
            CreatedAt = new DateTime(2026, 2, 11),
            DueDate = new DateTime(2026, 2, 18, 23, 59, 0),
            SessionId = 3
        },

        new Quiz
        {
            Id = 2,
            Title = "DevOps Essentials Quiz",
            Type = "multiple_choice",
            IsGraded = true,
            CreatedAt = new DateTime(2026, 3, 4),
            DueDate = new DateTime(2026, 3, 11, 23, 59, 0),
            SessionId = 10
        }
    );


    // =========================================================
    // QUIZ QUESTIONS
    // =========================================================

    mb.Entity<QuizQuestion>().HasData(
        new QuizQuestion
        {
            Id = 1,
            QuizId = 1,
            QuestionText = "What does REST commonly use for communication?",
            OptionA = "HTTP",
            OptionB = "FTP",
            OptionC = "SMTP",
            OptionD = "SSH",
            CorrectAnswer = "A",
            Points = 2,
            Order = 1
        },

        new QuizQuestion
        {
            Id = 2,
            QuizId = 1,
            QuestionText = "Which HTTP status code represents a successful request?",
            OptionA = "404",
            OptionB = "500",
            OptionC = "200",
            OptionD = "301",
            CorrectAnswer = "C",
            Points = 2,
            Order = 2
        },

        new QuizQuestion
        {
            Id = 3,
            QuizId = 2,
            QuestionText = "What is Docker mainly used for?",
            OptionA = "Photo editing",
            OptionB = "Containerization",
            OptionC = "Database design only",
            OptionD = "Email management",
            CorrectAnswer = "B",
            Points = 2,
            Order = 1
        },

        new QuizQuestion
        {
            Id = 4,
            QuizId = 2,
            QuestionText = "What does CI commonly stand for?",
            OptionA = "Continuous Integration",
            OptionB = "Cloud Interface",
            OptionC = "Code Installation",
            OptionD = "Computer Integration",
            CorrectAnswer = "A",
            Points = 2,
            Order = 2
        }
    );


    // =========================================================
    // ASSIGNMENTS
    // =========================================================

    mb.Entity<Assignment>().HasData(
        new Assignment
        {
            Id = 1,
            Title = "Build a REST API",
            Description = "Create a small REST API with CRUD operations.",
            IsGraded = true,
            CreatedAt = new DateTime(2026, 2, 12),
            DueDate = new DateTime(2026, 2, 20, 23, 59, 0),
            SessionId = 3
        },

        new Assignment
        {
            Id = 2,
            Title = "Cloud Architecture Research",
            Description = "Prepare a short report comparing cloud service models.",
            IsGraded = true,
            CreatedAt = new DateTime(2026, 2, 16),
            DueDate = new DateTime(2026, 2, 25, 23, 59, 0),
            SessionId = 5
        },

        new Assignment
        {
            Id = 3,
            Title = "Docker Container Exercise",
            Description = "Containerize a simple web application using Docker.",
            IsGraded = false,
            CreatedAt = new DateTime(2026, 3, 4),
            DueDate = new DateTime(2026, 3, 14, 23, 59, 0),
            SessionId = 10
        }
    );


    // =========================================================
    // ASSIGNMENT SUBMISSIONS
    // =========================================================

    mb.Entity<AssignmentSubmission>().HasData(
        new AssignmentSubmission
        {
            Id = 1,
            AssignmentId = 1,
            StudentId = 9,
            FileUrl = "https://example.com/submissions/rest-api-hana.zip",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 2, 18, 19, 30, 0)
        },

        new AssignmentSubmission
        {
            Id = 2,
            AssignmentId = 1,
            StudentId = 10,
            FileUrl = "https://example.com/submissions/rest-api-adam.zip",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 2, 19, 21, 15, 0)
        },

        new AssignmentSubmission
        {
            Id = 3,
            AssignmentId = 1,
            StudentId = 11,
            FileUrl = "https://example.com/submissions/rest-api-jana.zip",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 2, 20, 18, 45, 0)
        },

        new AssignmentSubmission
        {
            Id = 4,
            AssignmentId = 2,
            StudentId = 12,
            FileUrl = "https://example.com/submissions/cloud-yassin.pdf",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 2, 23, 16, 20, 0)
        },

        new AssignmentSubmission
        {
            Id = 5,
            AssignmentId = 2,
            StudentId = 13,
            FileUrl = "https://example.com/submissions/cloud-malak.pdf",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 2, 24, 20, 10, 0)
        },

        new AssignmentSubmission
        {
            Id = 6,
            AssignmentId = 3,
            StudentId = 17,
            FileUrl = "https://example.com/submissions/docker-salma.zip",
            SubmissionType = "file",
            SubmittedAt = new DateTime(2026, 3, 10, 22, 0, 0)
        }
    );


    // =========================================================
    // TICKETS
    // =========================================================

    mb.Entity<Ticket>().HasData(
        new Ticket
        {
            Id = 1,
            Title = "Unable to access session recording",
            Description = "The recording link for the previous session is not opening.",
            Status = "in_progress",
            StudentId = 9,
            CreatedAt = new DateTime(2026, 2, 13, 15, 30, 0)
        },

        new Ticket
        {
            Id = 2,
            Title = "Request to update profile information",
            Description = "I need to update my phone number and city in my profile.",
            Status = "in_progress",
            StudentId = 12,
            CreatedAt = new DateTime(2026, 2, 19, 12, 45, 0)
        },

        new Ticket
        {
            Id = 3,
            Title = "Assignment submission issue",
            Description = "The system does not allow me to upload my assignment file.",
            Status = "open",
            StudentId = 16,
            CreatedAt = new DateTime(2026, 2, 26, 21, 10, 0)
        },

        new Ticket
        {
            Id = 4,
            Title = "Attendance correction request",
            Description = "I attended the session but my attendance appears as absent.",
            Status = "open",
            StudentId = 18,
            CreatedAt = new DateTime(2026, 3, 5, 18, 20, 0)
        }
    );


    // =========================================================
    // TICKET REPLIES
    // =========================================================

    mb.Entity<TicketReply>().HasData(
        new TicketReply
        {
            Id = 1,
            TicketId = 1,
            UserId = 2,
            Message = "We are checking the recording link and will update you shortly.",
            CreatedAt = new DateTime(2026, 2, 13, 16, 0, 0)
        },

        new TicketReply
        {
            Id = 2,
            TicketId = 2,
            UserId = 3,
            Message = "Your profile information can be updated from the account settings.",
            CreatedAt = new DateTime(2026, 2, 19, 13, 20, 0)
        },

        new TicketReply
        {
            Id = 3,
            TicketId = 3,
            UserId = 4,
            Message = "Please try uploading the file again after refreshing the page.",
            CreatedAt = new DateTime(2026, 2, 26, 21, 40, 0)
        }
    );


    // =========================================================
    // SURVEYS
    // =========================================================

    mb.Entity<Survey>().HasData(
        new Survey
        {
            Id = 1,
            Title = "Backend Session Feedback",
            SessionId = 1,
            CreatedAt = new DateTime(2026, 2, 7)
        },

        new Survey
        {
            Id = 2,
            Title = "Cloud Session Feedback",
            SessionId = 4,
            CreatedAt = new DateTime(2026, 2, 14)
        }
    );


    // =========================================================
    // SURVEY SUBMISSIONS
    // =========================================================

    mb.Entity<SurveySubmission>().HasData(
        new SurveySubmission
        {
            Id = 1,
            SurveyId = 1,
            StudentId = 9,
            Rating = 4.5m,
            Feedback = "Very clear explanation and useful examples.",
            SubmittedAt = new DateTime(2026, 2, 7, 13, 0, 0)
        },

        new SurveySubmission
        {
            Id = 2,
            SurveyId = 1,
            StudentId = 10,
            Rating = 4.0m,
            Feedback = "Good session and the practical examples were helpful.",
            SubmittedAt = new DateTime(2026, 2, 7, 13, 15, 0)
        },

        new SurveySubmission
        {
            Id = 3,
            SurveyId = 2,
            StudentId = 12,
            Rating = 5.0m,
            Feedback = "Excellent introduction to cloud computing.",
            SubmittedAt = new DateTime(2026, 2, 14, 14, 0, 0)
        },

        new SurveySubmission
        {
            Id = 4,
            SurveyId = 2,
            StudentId = 13,
            Rating = 4.5m,
            Feedback = "The examples made the concepts easier to understand.",
            SubmittedAt = new DateTime(2026, 2, 14, 14, 20, 0)
        }
    );
}}