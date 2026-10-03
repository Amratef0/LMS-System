# 🎓 LMS Pro — Learning Management System

![CI](https://github.com/Amratef0/LMS-System/actions/workflows/ci.yml/badge.svg)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular)
![Flutter](https://img.shields.io/badge/Flutter-Mobile-02569B?logo=flutter)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white)

Full-stack LMS available on **web** and **mobile**:

- **Backend:** .NET 8 Web API + EF Core + SQL Server
- **Web:** Angular 17 (Standalone) with English / Arabic (RTL) support
- **Mobile:** Flutter app consuming the same REST API
- **DevOps:** Docker, Docker Compose, and GitHub Actions CI/CD

---

## 📌 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start (Docker)](#-quick-start-docker)
- [CI/CD](#-cicd)
- [Mobile App (Flutter)](#-mobile-app-flutter)
- [Demo Accounts](#-demo-accounts)
- [Features by Role](#-features-by-role)
- [Languages](#-languages)
- [Architecture](#-architecture)
- [Database Entities](#️-database-entities)
- [Key Technical Decisions](#-key-technical-decisions)
- [Running without Docker](#-running-without-docker)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Backend | .NET 8 Web API, Entity Framework Core, JWT Bearer authentication |
| Database | SQL Server 2022 |
| Web frontend | Angular 17 (Standalone components), TypeScript, SCSS |
| Mobile | Flutter (Dart) |
| Containerization | Docker, Docker Compose |
| Web server | Nginx (serves the Angular build and proxies `/api`) |
| CI/CD | GitHub Actions, GitHub Container Registry (GHCR) |

---

## 🐳 Quick Start (Docker)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) only — no .NET SDK, Node.js, or SQL Server needed.

```bash
# 1. Clone the repository
git clone https://github.com/Amratef0/LMS-System.git
cd LMS-System

# 2. Create your environment file and set your own values
cp .env.example .env

# 3. Build and run the whole stack (SQL Server + API + Web)
docker compose up --build
```

| Service | URL |
|---|---|
| Web app (Angular + Nginx) | http://localhost:4200 |
| API | http://localhost:5000/api |
| Swagger UI | http://localhost:5000/swagger *(when enabled for the environment)* |
| SQL Server | `localhost:1433` (user: `sa`) |

The database is migrated and seeded automatically on first run. Data is persisted in Docker volumes (`sqldata` for the database, `uploads` for uploaded PDFs).

```bash
docker compose down        # stop, keep the data
docker compose down -v     # stop and remove all data
```

### 🔑 Environment Variables

Secrets are passed through the `.env` file (never committed). See [`.env.example`](.env.example):

| Variable | Description |
|---|---|
| `SA_PASSWORD` | SQL Server `sa` password (must be a strong password) |
| `JWT_KEY` | Secret used to sign JWT tokens (use a long random value) |
| `ASPNETCORE_ENVIRONMENT` | `Production` (default) or `Development` |

---

## 🔄 CI/CD

Every push and pull request to `main` triggers a **GitHub Actions** pipeline (`.github/workflows/ci.yml`):

1. **Backend** — restores and builds the .NET solution.
2. **Frontend** — installs dependencies (`npm ci`) and builds Angular in production mode.
3. **Docker** *(on push only)* — builds both images and publishes them to **GitHub Container Registry**:

```bash
docker pull ghcr.io/amratef0/lms-system-api:latest
docker pull ghcr.io/amratef0/lms-system-web:latest
```

---

## 📱 Mobile App (Flutter)

A **Flutter** mobile app is also available for LMS Pro. It uses the same REST API as the web application, so accounts, roles, and data are shared across web and mobile.

 Repository: [LMS Mobile App (Flutter)](https://github.com/Amratef0/YOUR-FLUTTER-REPO)

**Connecting the mobile app to the local API**

With the Docker stack running, the API is exposed on port `5000`:

| Where the app runs | API base URL |
|---|---|
| Android emulator | `http://10.0.2.2:5000/api` |
| iOS simulator | `http://localhost:5000/api` |
| Physical device (same Wi-Fi) | `http://<your-computer-ip>:5000/api` |

---

## 🔐 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.com | Admin@123 |
| Coordinator | amr45409@gmail.com | Coord@123 |
| Student | ahmed.hassan@gmail.com | Student@123 |
| Student | soha199922@gmail.com | Student@123 |

---

## ✨ Features by Role

### 👑 Admin
- **Dashboard** — full stats: sessions, attendance, assignments, gender breakdown
- **Coordinators** — add, edit, change password, activate/deactivate, delete
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
- **Quizzes** — take quizzes on a dedicated page (opens when the quiz is active and the deadline hasn't passed); see score after submission
- **Assignments** — submit work as a PDF file upload or external link; see grade and coordinator feedback once graded
- **Tickets** — submit support requests; view own ticket history

---

## 🌐 Languages

The web UI supports **English** (default) and **Arabic** with full RTL layout. Switch with the language button in the top bar — the choice is saved per browser.

---

## 📐 Architecture

```
LMS-System/
├── .github/workflows/
│   └── ci.yml                       CI/CD pipeline (build + publish Docker images)
├── docker-compose.yml               SQL Server + API + Web
├── .env.example                     Environment variables template
│
├── backend/
│   └── LMS.API/                     .NET 8 Web API
│       ├── Dockerfile               Multi-stage build (SDK → ASP.NET runtime)
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
        ├── Dockerfile               Node build → Nginx
        ├── nginx.conf               Serves the SPA and proxies /api and /uploads
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
            │   │   └── toast/       Global notification system
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

```
 Browser ──► Nginx (web:80) ──► /api, /uploads ──► .NET API (api:8080) ──► SQL Server
 Flutter app ─────────────────────────────────────►
```

---

## 🗄️ Database Entities

| Entity | Description |
|---|---|
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

All `DateTime` columns are stored as UTC in SQL Server and automatically tagged `Kind=Utc` on read via a global EF Core value converter, ensuring JSON responses always include the `Z` suffix so clients render times correctly in the viewer's local timezone.

---

## 🔑 Key Technical Decisions

- **Auth**: JWT Bearer (7-day expiry), role stored as a claim — no refresh tokens needed for this scale
- **Timezone**: UTC in DB, automatic UTC tag on EF Core read, browser-local display via `CairoDatePipe`
- **File uploads**: Multipart PDF upload to `/api/files/upload-pdf` (15 MB max); files served statically from `/uploads/`
- **Pagination**: All list endpoints accept `page` + `pageSize`; the frontend `goPage()` method ensures the API is called when the user clicks a page button
- **Attendance %**: Counts sessions where status is `running` or `finished` as the denominator; counts only attendance records for the student's own group sessions as the numerator
- **Quiz freeze prevention**: Quiz-taking uses a dedicated route (`/sessions/:id/quiz/:quizId`) with data pre-computed once on load — no function calls inside `*ngFor` templates that could trigger change-detection loops
- **i18n**: Lightweight signal-based translation system (no external library); the `| t` pipe is `pure: false` so it re-evaluates when the language signal changes; RTL handled via the `dir` attribute on `<html>` + CSS logical properties
- **Containerization**: multi-stage Docker builds; Nginx serves the Angular build and proxies API calls, so the browser talks to a single origin (no CORS setup needed)
- **Secrets**: credentials are injected through environment variables, never stored in the repository

---

## 💻 Running without Docker

**Prerequisites**

| Tool | Version | Link |
|---|---|---|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| SQL Server | Any edition (Express / LocalDB / Full) | https://www.microsoft.com/sql-server |
| Node.js | 18+ | https://nodejs.org |
| Angular CLI | Latest | `npm install -g @angular/cli` |

### Backend

1. Set your connection string in `backend/LMS.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

| SQL Server edition | Connection string |
|---|---|
| Full SQL Server (default instance) | `Server=localhost;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| SQL Server Express | `Server=localhost\SQLEXPRESS;Database=LmsDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| LocalDB | `Server=(localdb)\mssqllocaldb;Database=LmsDb;Trusted_Connection=True;` |

2. Apply the migrations and run the API:

```bash
cd backend/LMS.API
dotnet ef database update
dotnet run
```

> ⚠️ **Existing database?** The schema includes an `Instructors` table where `Session.TrainerId` points to instructors (not users). If you have an older database, drop it first:
>
> ```bash
> dotnet ef database drop --force
> dotnet ef database update
> ```

| Endpoint | URL |
|---|---|
| API base | http://localhost:5000/api |
| Swagger UI | http://localhost:5000/swagger |
| Uploaded files | http://localhost:5000/uploads/... |

Uploaded PDFs (assignment submissions & session attachments) are saved in `backend/LMS.API/Uploads/`.

### Frontend

```bash
cd frontend/lms-frontend
npm install
ng serve
```

App runs at: **http://localhost:4200**

---

## 👤 Author

**Amr Atef** — [@Amratef0](https://github.com/Amratef0)
