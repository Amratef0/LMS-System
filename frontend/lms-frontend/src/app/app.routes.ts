import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'sessions', pathMatch: 'full' },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login/login.component').then(m=>m.LoginComponent) },
  { path: 'dashboard',   canActivate:[authGuard, roleGuard(['Admin','Coordinator','Student'])], loadComponent: ()=>import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent) },
  { path: 'sessions',    canActivate:[authGuard], loadComponent: ()=>import('./features/sessions/list/sessions-list.component').then(m=>m.SessionsListComponent) },
  { path: 'sessions/new',canActivate:[authGuard, roleGuard(['Admin'])], loadComponent: ()=>import('./features/sessions/form/session-form.component').then(m=>m.SessionFormComponent) },
  { path: 'sessions/:id',canActivate:[authGuard], loadComponent: ()=>import('./features/sessions/detail/session-detail.component').then(m=>m.SessionDetailComponent) },
  { path: 'sessions/:id/edit', canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/sessions/form/session-form.component').then(m=>m.SessionFormComponent) },
  { path: 'sessions/:id/quiz/:quizId', canActivate:[authGuard, roleGuard(['Student'])], loadComponent: ()=>import('./features/quizzes/take/take-quiz.component').then(m=>m.TakeQuizComponent) },
  { path: 'groups',      canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/groups/list/groups-list.component').then(m=>m.GroupsListComponent) },
  { path: 'instructors', canActivate:[authGuard, roleGuard(['Admin'])], loadComponent: ()=>import('./features/instructors/list/instructors-list.component').then(m=>m.InstructorsListComponent) },
  { path: 'coordinators', canActivate:[authGuard, roleGuard(['Admin'])], loadComponent: ()=>import('./features/coordinators/list/coordinators-list.component').then(m=>m.CoordinatorsListComponent) },
  { path: 'students',    canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/students/list/students-list.component').then(m=>m.StudentsListComponent) },
  { path: 'quizzes',     canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/quizzes/list/quizzes-list.component').then(m=>m.QuizzesListComponent) },
  { path: 'assignments', canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/assignments/list/assignments-list.component').then(m=>m.AssignmentsListComponent) },
  { path: 'tickets',     canActivate:[authGuard], loadComponent: ()=>import('./features/tickets/list/tickets-list.component').then(m=>m.TicketsListComponent) },
  { path: 'reports',     canActivate:[authGuard, roleGuard(['Admin','Coordinator'])], loadComponent: ()=>import('./features/reports/reports.component').then(m=>m.ReportsComponent) },
  { path: 'my-report',  canActivate:[authGuard, roleGuard(['Student'])], loadComponent: ()=>import('./features/reports/my-report.component').then(m=>m.MyReportComponent) },
  { path: '**', redirectTo: 'sessions' }
];
