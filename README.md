# LMS Pro — Learning Management System

Full-stack LMS built with **.NET 8 Web API** (backend) and **Angular 17 Standalone** (frontend).

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Link |
|------|---------|------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| SQL Server | Any edition (Express / LocalDB / Full) | https://www.microsoft.com/sql-server |
| Node.js | 18+ | https://nodejs.org |
| Angular CLI | Latest | `npm install -g @angular/cli` |

---

### Step 1 — Backend

**1. Open the solution in Visual Studio:**
```
backend/LMS.sln
```

**2. Set your connection string** in `backend/LMS.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

| SQL Server edition | Connection string |
|--------------------|-------------------|
| Full SQL Server (default instance) | `Server=localhost;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| SQL Server Express | `Server=localhost\SQLEXPRESS;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| LocalDB | `Server=(localdb)\mssqllocaldb;Database=LmsDb;Trusted_Connection=True;` |

**3. Run migrations** — choose one method:

*Package Manager Console (Visual Studio):*
```
Add-Migration InitialCreate
Update-Database
```

*Terminal:*
```bash
cd backend/LMS.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

> ⚠️ **Existing database?** The project schema includes an `Instructors` table where `Session.TrainerId` now points to instructors (not users). If you have an older database, drop it first:
> ```bash
> dotnet ef database drop --force
> dotnet ef migrations add InitialCreate
> dotnet ef database update
> ```

**4. Run the API:**

- Visual Studio → press **F5**, OR
- Terminal: `cd backend/LMS.API && dotnet run`

| Endpoint | URL |
|----------|-----|
| API base | http://localhost:5000/api |
| Swagger UI | http://localhost:5000/swagger |
| Uploaded files | http://localhost:5000/uploads/... |

Uploaded PDFs (assignment submissions & session attachments) are saved in `backend/LMS.API/Uploads/`.

---

### Step 2 — Frontend

```bash
cd frontend/lms-frontend
npm install
ng serve
```

App runs at: **http://localhost:4200**

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | Admin@123 |
| Coordinator | amr45409@gmail.com | Coord@123 |
| Student | ahmed.hassan@gmail.com | Student@123 |
| Student | soha199922@gmail.com | Student@123 |

---

## ✨ Features by Role

### 👑 Admin
- **Dashboard** — full stats: sessions, attendance, assignments, gender breakdown
- **Coordinators** — add, edit, change password, activate/deactivate, delete (new)
- **Instructors** — add, edit, activate/deactivate, delete; used as the trainer dropdown when creating sessions
- **Groups** — create groups, assign/remove coordinators, view teams
- **Sessions** — create sessions for any group, edit, run/complete/cancel
- **Students** — add, edit details, change password
- **Quizzes** — view all quizzes and student submissions across all groups
- **Assignments** — view all assignments and submissions, grade student work
- **Tickets** — view all tickets, reply, change status

### 🎓 Coordinator
- **Dashboard** — stats scoped to their assigned groups
- **Sessions** — view and edit sessions for their groups; run/complete/cancel
- **Attendance** — take attendance (toggle per student)
- **Quizzes** — add quizzes with MCQ questions, correct answers, and per-question points
- **Assignments** — add/edit assignments with deadlines; view submissions and grade
- **Attachments** — upload PDF files or add external links to sessions
- **Record link** — set the session recording URL after a session finishes
- **Tickets** — reply to student tickets, change ticket status

### 👨‍🎓 Student
- **Dashboard** — personal score report (points obtained / total points / overall %), attendance rate, quiz average, assignment grades, upcoming deadlines, recent results table
- **Sessions** — view sessions for their group; see their own attendance status (Attended / Absent)
- **Quizzes** — take quizzes on a dedicated page (opens when quiz is active and deadline hasn't passed); see score after submission
- **Assignments** — submit work as a PDF file upload or external link; see grade and coordinator feedback once graded
- **Tickets** — submit support requests; view own ticket history

---

## 🌐 Languages

The UI supports **English** (default) and **Arabic** with full RTL layout. Switch with the language button in the top bar — the choice is saved per browser.

---

## 📐 Architecture

```
lms/
├── backend/
│   └── LMS.API/                     .NET 8 Web API
│       ├── Controllers/             11 controllers
│       │   ├── AuthController       Login, change password
│       │   ├── SessionsController   CRUD + lifecycle + attendance + attachments
│       │   ├── QuizzesController    CRUD + student submission + auto-grading
│       │   ├── AssignmentsController CRUD + submission + grading
│       │   ├── StudentsController   CRUD + student code generation
│       │   ├── GroupsController     CRUD + coordinator assignment + teams
│       │   ├── InstructorsController CRUD + activate/deactivate
│       │   ├── UsersController      Coordinator CRUD + password reset
│       │   ├── TicketsController    Tickets + replies + status
│       │   ├── DashboardController  Role-aware stats (Admin/Coord/Student)
│       │   └── FilesController      PDF upload endpoint
│       ├── Models/Entities.cs       All EF Core entity classes
│       ├── Data/AppDbContext.cs     DbContext + seed data + UTC DateTime converter
│       ├── Helpers/JwtHelper.cs     JWT generation (7-day expiry)
│       └── Middleware/              Global exception handler → JSON 500
│
└── frontend/
    └── lms-frontend/                Angular 17 Standalone
        └── src/app/
            ├── core/
            │   ├── services/        11 services (auth, sessions, quizzes, ...)
            │   ├── guards/          authGuard + roleGuard(roles[])
            │   ├── interceptors/    JWT Bearer token on every request
            │   └── i18n/            Translation service + pipe (EN/AR)
            ├── shared/
            │   ├── components/
            │   │   ├── sidebar/     Role-aware navigation + RTL collapse arrow
            │   │   ├── header/      Theme toggle + language toggle
            │   │   └── toast/       Global notification system (success/error/info/warning)
            │   └── pipes/
            │       └── cairo-date   Formats UTC dates using the browser's local timezone
            └── features/
                ├── auth/            Login page
                ├── dashboard/       Admin+Coordinator stats / Student score report
                ├── sessions/        List, detail, add/edit form, take-quiz page
                ├── coordinators/    Admin-only coordinator management
                ├── instructors/     Admin-only instructor management
                ├── groups/          Groups + teams + coordinator assignment
                ├── students/        Student list + add/edit + password reset
                ├── quizzes/         Quiz list + submissions view
                ├── assignments/     Assignment list + submissions + grading
                └── tickets/         Student submit view / Admin+Coord management view
```

---

## 🗄️ Database Entities

| Entity | Description |
|--------|-------------|
| `User` | Admin, Coordinator, Student accounts with hashed passwords |
| `Instructor` | Independent trainer records (no login); linked to Sessions |
| `Group` | Training group with start/end dates |
| `CoordinatorGroup` | Many-to-many: which coordinator manages which group |
| `StudentGroup` | Many-to-many: which student belongs to which group |
| `Team` | Sub-group within a Group |
| `TeamMember` | Student → Team assignment |
| `Session` | A scheduled session with lifecycle (pending → running → finished/cancelled) |
| `SessionAttachment` | PDF file or external link attached to a session |
| `Attendance` | Per-student attendance record per session |
| `Quiz` | Quiz linked to a session; MCQ or True/False |
| `QuizQuestion` | Individual question with options, correct answer, and point value |
| `QuizSubmission` | Student answers + auto-calculated score |
| `Assignment` | Assignment linked to a session with optional deadline |
| `AssignmentSubmission` | Student file upload / link; holds grade + feedback |
| `Ticket` | Student support request |
| `TicketReply` | Coordinator/Admin reply to a ticket |

All `DateTime` columns are stored as UTC in SQL Server and automatically tagged `Kind=Utc` on read via a global EF Core value converter, ensuring JSON responses always include the `Z` suffix so browsers render times correctly in the viewer's local timezone.

---

## 🔑 Key Technical Decisions

- **Auth**: JWT Bearer (7-day expiry), role stored as a claim — no refresh tokens needed for this scale
- **Timezone**: UTC in DB, automatic UTC tag on EF Core read, browser-local display via `CairoDatePipe`
- **File uploads**: Multipart PDF upload to `/api/files/upload-pdf` (15 MB max); files served statically from `/uploads/`
- **Pagination**: All list endpoints accept `page` + `pageSize`; frontend `goPage()` method ensures the API is actually called when the user clicks a page button
- **Attendance %**: Counts sessions where status is `running` or `finished` (not just `finished`) as the denominator; counts only attendance records for the student's own group sessions as the numerator
- **Quiz freeze prevention**: Quiz-taking uses a dedicated route (`/sessions/:id/quiz/:quizId`) with data pre-computed once on load — no function calls inside `*ngFor` templates that could trigger Angular change-detection loops
- **i18n**: Lightweight signal-based translation system (no external library); `| t` pipe is `pure: false` so it re-evaluates when the language signal changes; RTL handled via `dir` attribute on `<html>` + CSS logical properties throughout
