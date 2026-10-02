using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LMS.API.Migrations
{
    /// <inheritdoc />
    public partial class initialcreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Instructors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Instructors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NationalId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StudentCode = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CoordinatorGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CoordinatorId = table.Column<int>(type: "int", nullable: false),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoordinatorGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoordinatorGroups_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CoordinatorGroups_Users_CoordinatorId",
                        column: x => x.CoordinatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerId = table.Column<int>(type: "int", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordLink = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartedById = table.Column<int>(type: "int", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedById = table.Column<int>(type: "int", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AttendanceTakenById = table.Column<int>(type: "int", nullable: true),
                    AttendanceTakenAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sessions_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Sessions_Instructors_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "Instructors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Sessions_Users_AttendanceTakenById",
                        column: x => x.AttendanceTakenById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Sessions_Users_EndedById",
                        column: x => x.EndedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Sessions_Users_StartedById",
                        column: x => x.StartedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudentGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentGroups_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentGroups_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    TeamLeadId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teams_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teams_Users_TeamLeadId",
                        column: x => x.TeamLeadId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Assignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsGraded = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SessionId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assignments_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Attendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Joined = table.Column<bool>(type: "bit", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attendances_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attendances_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Quizzes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsGraded = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SessionId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quizzes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quizzes_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SessionAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachmentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedById = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionAttachments_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionAttachments_Users_UploadedById",
                        column: x => x.UploadedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Surveys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Surveys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Surveys_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TeamMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamMembers_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamMembers_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketReplies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketReplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketReplies_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketReplies_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssignmentSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssignmentId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmissionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Grade = table.Column<int>(type: "int", nullable: true),
                    GradeFeedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentSubmissions_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignmentSubmissions_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuizQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizId = table.Column<int>(type: "int", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OptionA = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionB = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionC = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OptionD = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectAnswer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizQuestions_Quizzes_QuizId",
                        column: x => x.QuizId,
                        principalTable: "Quizzes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    TotalPoints = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Answers = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizSubmissions_Quizzes_QuizId",
                        column: x => x.QuizId,
                        principalTable: "Quizzes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuizSubmissions_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SurveySubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SurveyId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Feedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SurveySubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SurveySubmissions_Surveys_SurveyId",
                        column: x => x.SurveyId,
                        principalTable: "Surveys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SurveySubmissions_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Groups",
                columns: new[] { "Id", "Code", "CreatedAt", "EndDate", "IsActive", "Name", "StartDate" },
                values: new object[,]
                {
                    { 1, "CAI4_AIS3_S2", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "CAI4_AIS3_S2", new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "GIZ4_DRT5_G1", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 25, 0, 0, 0, 0, DateTimeKind.Utc), true, "GIZ4_DRT5_G1", new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "GIZ4_DRT5_S1", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 25, 0, 0, 0, 0, DateTimeKind.Utc), true, "GIZ4_DRT5_S1", new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "ONL4_DRT6_S1", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), true, "ONL4_DRT6_S1", new DateTime(2025, 12, 9, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "Instructors",
                columns: new[] { "Id", "Bio", "CreatedAt", "Email", "IsActive", "Name", "Phone" },
                values: new object[,]
                {
                    { 1, "Senior Full-Stack Instructor", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "alaaelawady50@gmail.com", true, "Alaa Elawady", "01011112222" },
                    { 2, "Soft Skills Trainer", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "emad.instructor@lms.com", true, "Emad Eletreby", "01022223333" },
                    { 3, "Backend & Cloud Instructor", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "polakamal@hotmail.com", true, "Pola Zaki", "01033334444" },
                    { 4, "Frontend Instructor", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "hatem.heshmat@gmail.com", true, "Hatem Heshmat", "01044445555" },
                    { 5, "DevOps & Infrastructure", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mostafa.instructor@lms.com", true, "Mostafa Ayman", "01055556666" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "City", "CreatedAt", "Email", "Gender", "IsActive", "Name", "NationalId", "PasswordHash", "Phone", "Role", "StudentCode" },
                values: new object[,]
                {
                    { 1, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@lms.com", null, true, "System Admin", null, "$2a$11$.nzrka3F2S10Stz6YTE1.O/irrC/D.wzsH.MUz8K.3W5HCff2QVAi", null, "Admin", null },
                    { 2, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "amr45409@gmail.com", null, true, "Amr Atef", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", "01012345678", "Coordinator", null },
                    { 3, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "sara.coord@lms.com", null, true, "Sara Mohamed", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", "01098765432", "Coordinator", null },
                    { 4, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "alaaelawady50@gmail.com", null, true, "Alaa Elawady", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", null, "Coordinator", null },
                    { 5, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "emad@lms.com", null, true, "Emad Eletreby", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", null, "Coordinator", null },
                    { 6, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "polakamal@hotmail.com", null, true, "Pola Zaki", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", null, "Coordinator", null },
                    { 7, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "hatem.heshmat@gmail.com", null, true, "Hatem Heshmat", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", null, "Coordinator", null },
                    { 8, null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mostafa@lms.com", null, true, "Mostafa Ayman", null, "$2a$11$2qGeXF8MhUbnOC3BgL4qA.Me0R8faRzhCxMDFWSsRtmc4LGoGygIW", null, "Coordinator", null },
                    { 9, "Cairo", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "soha199922@gmail.com", "Female", true, "Soha Osama", "99901555459839", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "+201555459839", "Student", "STU-0009" },
                    { 10, null, new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "seif23018449@gmail.com", "Male", true, "Saif Al Deen Mohamed", "30512202103877", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01006042020", "Student", "STU-0010" },
                    { 11, null, new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "aya479360@gmail.com", "Female", true, "Aya Ezzat Mohamed", "30209171700745", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01096196775", "Student", "STU-0011" },
                    { 12, null, new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ayatmohamed542@gmail.com", "Female", true, "Aya Mohamed Abd Elmotaal", "30407271700668", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01021309389", "Student", "STU-0012" },
                    { 13, null, new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mariamhany332004@gmail.com", "Female", true, "Mariam Hany Abdelmohseen", "30403031700746", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01158884919", "Student", "STU-0013" },
                    { 14, "Alexandria", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ahmed.hassan@gmail.com", "Male", true, "Ahmed Hassan", "20001011234567", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01112345678", "Student", "STU-0014" },
                    { 15, "Giza", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "mohamed.ali@gmail.com", "Male", true, "Mohamed Ali", "20002021234568", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01223456789", "Student", "STU-0015" },
                    { 16, "Cairo", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "nour.ibrahim@gmail.com", "Female", true, "Nour Ibrahim", "20003031234569", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01534567890", "Student", "STU-0016" },
                    { 17, "Cairo", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "omar.khalid@gmail.com", "Male", true, "Omar Khalid", "20004041234570", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01645678901", "Student", "STU-0017" },
                    { 18, "Mansoura", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "fatma.youssef@gmail.com", "Female", true, "Fatma Youssef", "20005051234571", "$2a$11$hr.7zd7ln87qSHBncG.1PuPN..XPt12MFkd2BIGYHSisnYEuW90le", "01756789012", "Student", "STU-0018" }
                });

            migrationBuilder.InsertData(
                table: "CoordinatorGroups",
                columns: new[] { "Id", "AssignedAt", "CoordinatorId", "GroupId" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, 1 },
                    { 2, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, 2 },
                    { 3, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, 3 },
                    { 4, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, 4 }
                });

            migrationBuilder.InsertData(
                table: "Sessions",
                columns: new[] { "Id", "AttendanceTakenAt", "AttendanceTakenById", "CreatedAt", "EndedAt", "EndedById", "GroupId", "Location", "Name", "RecordLink", "SessionDate", "StartedAt", "StartedById", "Status", "Topic", "TrainerId", "Type" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 11, 29, 15, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 11, 29, 15, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 1 - session 1", "https://zoom.us/rec/1", new DateTime(2025, 11, 29, 13, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 11, 29, 13, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 1, "live" },
                    { 2, new DateTime(2025, 12, 1, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 1, 20, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 1 - session 3", "https://zoom.us/rec/2", new DateTime(2025, 12, 1, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 1, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "soft skill", 2, "live" },
                    { 3, new DateTime(2025, 12, 2, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 2, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 2, 20, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 1 - session 2", "https://zoom.us/rec/3", new DateTime(2025, 12, 2, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 2, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 1, "live" },
                    { 4, new DateTime(2025, 12, 6, 15, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 15, 0, 0, 0, DateTimeKind.Utc), 2, 1, "Cairo Hub, Room 201", "week 2 - session 1", null, new DateTime(2025, 12, 6, 13, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 13, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 1, "physical" },
                    { 5, new DateTime(2025, 12, 6, 16, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 16, 0, 0, 0, DateTimeKind.Utc), 2, 2, null, "week 1 - session 1", "https://zoom.us/rec/5", new DateTime(2025, 12, 6, 14, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 14, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 3, "live" },
                    { 6, new DateTime(2025, 12, 6, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 20, 0, 0, 0, DateTimeKind.Utc), 2, 3, null, "week 1 - session 1", "https://zoom.us/rec/6", new DateTime(2025, 12, 6, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 6, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 4, "live" },
                    { 7, new DateTime(2025, 12, 8, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 8, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 8, 20, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 2 - session 3", "https://zoom.us/rec/7", new DateTime(2025, 12, 8, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 8, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "soft skill", 2, "live" },
                    { 8, new DateTime(2025, 12, 8, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 8, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 8, 20, 0, 0, 0, DateTimeKind.Utc), 2, 2, null, "week 1 - session 2", "https://zoom.us/rec/8", new DateTime(2025, 12, 8, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 8, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 3, "live" },
                    { 9, new DateTime(2025, 12, 9, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2025, 12, 9, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 9, 20, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 2 - session 2", "https://zoom.us/rec/9", new DateTime(2025, 12, 9, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 9, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 1, "live" },
                    { 10, new DateTime(2025, 12, 9, 21, 5, 0, 0, DateTimeKind.Utc), 3, new DateTime(2025, 12, 9, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 9, 21, 0, 0, 0, DateTimeKind.Utc), 3, 4, null, "week 2 - session 2", "https://zoom.us/rec/10", new DateTime(2025, 12, 9, 19, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 12, 9, 19, 0, 0, 0, DateTimeKind.Utc), 3, "finished", "technical", 5, "live" },
                    { 11, null, null, new DateTime(2025, 12, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 1, null, "week 3 - session 1", null, new DateTime(2025, 12, 13, 13, 0, 0, 0, DateTimeKind.Utc), null, null, "pending", "technical", 1, "live" },
                    { 12, new DateTime(2026, 5, 7, 20, 5, 0, 0, DateTimeKind.Utc), 2, new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 5, 7, 20, 0, 0, 0, DateTimeKind.Utc), 2, 1, null, "week 17 - session 2", "https://zoom.us/rec/12", new DateTime(2026, 5, 7, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 5, 7, 18, 0, 0, 0, DateTimeKind.Utc), 2, "finished", "technical", 1, "live" }
                });

            migrationBuilder.InsertData(
                table: "StudentGroups",
                columns: new[] { "Id", "GroupId", "JoinedAt", "StudentId" },
                values: new object[,]
                {
                    { 1, 2, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 9 },
                    { 2, 3, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 10 },
                    { 3, 3, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 11 },
                    { 4, 3, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 12 },
                    { 5, 3, new DateTime(2025, 12, 6, 0, 0, 0, 0, DateTimeKind.Utc), 13 },
                    { 6, 1, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 14 },
                    { 7, 1, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 15 },
                    { 8, 1, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 16 },
                    { 9, 4, new DateTime(2025, 12, 9, 0, 0, 0, 0, DateTimeKind.Utc), 17 },
                    { 10, 4, new DateTime(2025, 12, 9, 0, 0, 0, 0, DateTimeKind.Utc), 18 }
                });

            migrationBuilder.InsertData(
                table: "Tickets",
                columns: new[] { "Id", "CreatedAt", "Description", "Status", "StudentId", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 4, 2, 20, 0, 0, 0, DateTimeKind.Utc), "بسبب ظروف صحية والاب توب بانيظور مش هعرف اصلحه", "in_progress", 14, "انسحاب من المبادرة", null },
                    { 2, new DateTime(2025, 12, 20, 17, 0, 0, 0, DateTimeKind.Utc), "أتقدم باعتذاري عن اكمال كورس المبادرة blender", "in_progress", 15, "أعتذار عن المبادرة", null },
                    { 3, new DateTime(2025, 12, 12, 23, 0, 0, 0, DateTimeKind.Utc), "I am unable to replace a previously submitted assignment with an updated version.", "in_progress", 16, "Assignment Submission System Error", null }
                });

            migrationBuilder.InsertData(
                table: "Assignments",
                columns: new[] { "Id", "CreatedAt", "Description", "DueDate", "IsGraded", "SessionId", "Title" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Submit your Unity project", new DateTime(2026, 5, 16, 23, 59, 0, 0, DateTimeKind.Utc), true, 12, "Session Assignment" },
                    { 2, new DateTime(2026, 3, 11, 0, 0, 0, 0, DateTimeKind.Utc), "Week 11 session 2 assignment", new DateTime(2026, 3, 14, 23, 59, 0, 0, DateTimeKind.Utc), true, 9, "Week 11 Assignment" },
                    { 3, new DateTime(2026, 3, 3, 0, 0, 0, 0, DateTimeKind.Utc), "Research freelancing platforms", new DateTime(2026, 3, 17, 23, 59, 0, 0, DateTimeKind.Utc), false, 7, "Free Lancing Platforms Assignment" }
                });

            migrationBuilder.InsertData(
                table: "Attendances",
                columns: new[] { "Id", "Joined", "JoinedAt", "SessionId", "StudentId" },
                values: new object[,]
                {
                    { 1, true, new DateTime(2025, 11, 29, 13, 5, 0, 0, DateTimeKind.Utc), 1, 14 },
                    { 2, true, new DateTime(2025, 11, 29, 13, 10, 0, 0, DateTimeKind.Utc), 1, 15 },
                    { 3, false, null, 1, 16 },
                    { 4, true, new DateTime(2025, 12, 1, 18, 2, 0, 0, DateTimeKind.Utc), 2, 14 },
                    { 5, false, null, 2, 15 },
                    { 6, true, new DateTime(2025, 12, 1, 18, 15, 0, 0, DateTimeKind.Utc), 2, 16 },
                    { 7, true, new DateTime(2025, 12, 6, 14, 3, 0, 0, DateTimeKind.Utc), 5, 9 },
                    { 8, true, new DateTime(2025, 12, 6, 18, 1, 0, 0, DateTimeKind.Utc), 6, 10 },
                    { 9, false, null, 6, 11 },
                    { 10, true, new DateTime(2025, 12, 6, 18, 5, 0, 0, DateTimeKind.Utc), 6, 12 }
                });

            migrationBuilder.InsertData(
                table: "Quizzes",
                columns: new[] { "Id", "CreatedAt", "DueDate", "IsGraded", "SessionId", "Title", "Type" },
                values: new object[] { 1, new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 5, 14, 23, 59, 0, 0, DateTimeKind.Utc), true, 12, "Unity Basics Quiz", "multiple_choice" });

            migrationBuilder.InsertData(
                table: "SessionAttachments",
                columns: new[] { "Id", "AttachmentType", "CreatedAt", "FileUrl", "Link", "SessionId", "Title", "UploadedById" },
                values: new object[] { 1, "pdf", new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), "https://drive.google.com/file/intro.pdf", null, 1, "Session 1 - introduction", 2 });

            migrationBuilder.InsertData(
                table: "Surveys",
                columns: new[] { "Id", "CreatedAt", "SessionId", "Title" },
                values: new object[] { 1, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 1, "Session Feedback" });

            migrationBuilder.InsertData(
                table: "AssignmentSubmissions",
                columns: new[] { "Id", "AssignmentId", "FileUrl", "Grade", "GradeFeedback", "Link", "Notes", "StudentId", "SubmissionType", "SubmittedAt" },
                values: new object[,]
                {
                    { 1, 1, "https://drive.google.com/file/1", null, null, null, null, 14, "file", new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, 1, "https://drive.google.com/file/2", null, null, null, null, 15, "file", new DateTime(2026, 5, 11, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, 1, "https://drive.google.com/file/3", null, null, null, null, 16, "file", new DateTime(2026, 5, 12, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, 2, "https://drive.google.com/file/4", null, null, null, null, 14, "file", new DateTime(2026, 3, 12, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, 2, "https://drive.google.com/file/5", null, null, null, null, 15, "file", new DateTime(2026, 3, 13, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "QuizQuestions",
                columns: new[] { "Id", "CorrectAnswer", "OptionA", "OptionB", "OptionC", "OptionD", "Order", "Points", "QuestionText", "QuizId" },
                values: new object[,]
                {
                    { 1, "A", "A game engine", "A programming language", "A database", "An OS", 1, 2, "What is Unity?", 1 },
                    { 2, "C", "Java", "Python", "C#", "C++", 2, 2, "Which language does Unity primarily use?", 1 }
                });

            migrationBuilder.InsertData(
                table: "SurveySubmissions",
                columns: new[] { "Id", "Feedback", "Rating", "StudentId", "SubmittedAt", "SurveyId" },
                values: new object[,]
                {
                    { 1, "Great session!", 4.5m, 14, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { 2, "Good", 4.0m, 15, new DateTime(2025, 11, 29, 0, 0, 0, 0, DateTimeKind.Utc), 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_SessionId",
                table: "Assignments",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentSubmissions_AssignmentId",
                table: "AssignmentSubmissions",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentSubmissions_StudentId",
                table: "AssignmentSubmissions",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_SessionId",
                table: "Attendances",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_StudentId",
                table: "Attendances",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_CoordinatorGroups_CoordinatorId",
                table: "CoordinatorGroups",
                column: "CoordinatorId");

            migrationBuilder.CreateIndex(
                name: "IX_CoordinatorGroups_GroupId",
                table: "CoordinatorGroups",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Code",
                table: "Groups",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestions_QuizId",
                table: "QuizQuestions",
                column: "QuizId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizSubmissions_QuizId",
                table: "QuizSubmissions",
                column: "QuizId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizSubmissions_StudentId",
                table: "QuizSubmissions",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_SessionId",
                table: "Quizzes",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAttachments_SessionId",
                table: "SessionAttachments",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAttachments_UploadedById",
                table: "SessionAttachments",
                column: "UploadedById");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_AttendanceTakenById",
                table: "Sessions",
                column: "AttendanceTakenById");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_EndedById",
                table: "Sessions",
                column: "EndedById");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_GroupId",
                table: "Sessions",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_StartedById",
                table: "Sessions",
                column: "StartedById");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_TrainerId",
                table: "Sessions",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroups_GroupId",
                table: "StudentGroups",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentGroups_StudentId",
                table: "StudentGroups",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Surveys_SessionId",
                table: "Surveys",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveySubmissions_StudentId",
                table: "SurveySubmissions",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveySubmissions_SurveyId",
                table: "SurveySubmissions",
                column: "SurveyId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_StudentId",
                table: "TeamMembers",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TeamId",
                table: "TeamMembers",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_GroupId",
                table: "Teams",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_TeamLeadId",
                table: "Teams",
                column: "TeamLeadId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketReplies_TicketId",
                table: "TicketReplies",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketReplies_UserId",
                table: "TicketReplies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_StudentId",
                table: "Tickets",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_StudentCode",
                table: "Users",
                column: "StudentCode",
                unique: true,
                filter: "[StudentCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssignmentSubmissions");

            migrationBuilder.DropTable(
                name: "Attendances");

            migrationBuilder.DropTable(
                name: "CoordinatorGroups");

            migrationBuilder.DropTable(
                name: "QuizQuestions");

            migrationBuilder.DropTable(
                name: "QuizSubmissions");

            migrationBuilder.DropTable(
                name: "SessionAttachments");

            migrationBuilder.DropTable(
                name: "StudentGroups");

            migrationBuilder.DropTable(
                name: "SurveySubmissions");

            migrationBuilder.DropTable(
                name: "TeamMembers");

            migrationBuilder.DropTable(
                name: "TicketReplies");

            migrationBuilder.DropTable(
                name: "Assignments");

            migrationBuilder.DropTable(
                name: "Quizzes");

            migrationBuilder.DropTable(
                name: "Surveys");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "Sessions");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropTable(
                name: "Instructors");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
