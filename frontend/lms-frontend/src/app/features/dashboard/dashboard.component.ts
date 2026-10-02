import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { CairoDatePipe } from '../../shared/pipes/cairo-date.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CairoDatePipe, TranslatePipe],
  template: `
    <div *ngIf="loading()" class="spinner"></div>

    <!-- Admin / Coordinator Dashboard -->
    <ng-container *ngIf="!loading() && stats() && stats().role !== 'Student'">
      <div class="page-header">
        <h1>{{ 'dash.title' | t }}</h1>
        <p>{{ 'dash.subtitle' | t }}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="stat-value">{{ stats().totalStudents }}</div>
          <div class="stat-label">{{ 'dash.totalStudents' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="stat-value">{{ stats().totalAssessments }}</div>
          <div class="stat-label">{{ 'dash.totalAssessments' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          </div>
          <div class="stat-value">{{ stats().totalQuizzes }}</div>
          <div class="stat-label">{{ 'dash.totalQuizzes' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="stat-value">{{ stats().avgRating }}</div>
          <div class="stat-label">{{ 'dash.avgRating' | t }}</div>
        </div>
      </div>

      <div class="metrics-grid">
        <!-- Sessions -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.sessions' | t }}</h3><span class="badge badge-ghost">{{ 'dash.total' | t }}: {{ stats().sessions.total }}</span></div>
          <div class="card-body">
            <div class="metric-row"><span class="metric-label finished">{{ 'dash.finished' | t }}</span><strong>{{ stats().sessions.finished }}</strong></div>
            <div class="metric-row"><span class="metric-label pending">{{ 'dash.pending' | t }}</span><strong>{{ stats().sessions.pending }}</strong></div>
            <div class="metric-row"><span class="metric-label running">{{ 'dash.running' | t }}</span><strong>{{ stats().sessions.running }}</strong></div>
          </div>
        </div>

        <!-- Attendance -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.attendance' | t }}</h3><span class="badge badge-ghost">{{ 'dash.total' | t }}: {{ stats().attendance.total }}</span></div>
          <div class="card-body">
            <div class="progress-wrap"><div class="progress-fill primary" [style.width]="stats().attendance.joinRate + '%'"></div></div>
            <p class="rate-label">{{ 'dash.joinRate' | t }}: <strong>{{ stats().attendance.joinRate }}%</strong></p>
            <div class="metric-row"><span class="metric-label joined">{{ 'dash.joined' | t }}</span><strong>{{ stats().attendance.joined }}</strong></div>
            <div class="metric-row"><span class="metric-label absent">{{ 'dash.notJoined' | t }}</span><strong>{{ stats().attendance.notJoined }}</strong></div>
          </div>
        </div>

        <!-- Assignments -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.assignments' | t }}</h3></div>
          <div class="card-body">
            <div class="progress-wrap"><div class="progress-fill success" [style.width]="stats().assignments.rate + '%'"></div></div>
            <p class="rate-label">{{ 'dash.submissionRate' | t }}: <strong>{{ stats().assignments.rate }}%</strong></p>
            <div class="metric-row"><span class="metric-label">{{ 'dash.expected' | t }}</span><strong>{{ stats().assignments.total }}</strong></div>
            <div class="metric-row"><span class="metric-label joined">{{ 'dash.submitted' | t }}</span><strong>{{ stats().assignments.submitted }}</strong></div>
            <div class="metric-row"><span class="metric-label absent">{{ 'dash.notSubmitted' | t }}</span><strong>{{ stats().assignments.nonSubmitted }}</strong></div>
          </div>
        </div>

        <!-- Gender -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.gender' | t }}</h3></div>
          <div class="card-body">
            <div class="gender-bar-wrap">
              <div class="g-male" [style.flex]="stats().gender.male || 1"></div>
              <div class="g-female" [style.flex]="stats().gender.female || 1"></div>
            </div>
            <div class="gender-legend">
              <span><i class="dot male"></i>{{ 'dash.male' | t }}: {{ stats().gender.male }}</span>
              <span><i class="dot female"></i>{{ 'dash.female' | t }}: {{ stats().gender.female }}</span>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ═══════════ Student Dashboard ═══════════ -->
    <ng-container *ngIf="!loading() && stats() && stats().role === 'Student'">
      <div class="page-header">
        <h1>{{ 'dash.myTitle' | t }}</h1>
        <p>{{ 'dash.mySubtitle' | t }}</p>
      </div>

      <!-- Hero: overall score report -->
      <div class="score-hero">
        <div class="score-ring-wrap">
          <svg viewBox="0 0 140 140" class="score-ring">
            <circle cx="70" cy="70" r="60" class="ring-bg"/>
            <circle cx="70" cy="70" r="60" class="ring-fg"
              [style.strokeDasharray]="377"
              [style.strokeDashoffset]="377 - (377 * stats().scoreReport.percentage / 100)"/>
          </svg>
          <div class="ring-center">
            <div class="ring-percent">{{ stats().scoreReport.percentage }}%</div>
            <div class="ring-label">{{ 'dash.overall' | t }}</div>
          </div>
        </div>
        <div class="score-hero-details">
          <h3>{{ 'dash.scoreReport' | t }}</h3>
          <p class="score-hero-sub">{{ 'dash.scoreReportSub' | t }}</p>
          <div class="score-points-row">
            <div class="points-box">
              <div class="points-value">{{ stats().scoreReport.pointsObtained }}</div>
              <div class="points-label">{{ 'dash.pointsObtained' | t }}</div>
            </div>
            <div class="points-divider">/</div>
            <div class="points-box">
              <div class="points-value muted">{{ stats().scoreReport.totalPoints }}</div>
              <div class="points-label">{{ 'dash.totalPoints' | t }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick stat cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="stat-value">{{ stats().attendance.rate }}%</div>
          <div class="stat-label">{{ 'dash.attendanceRate' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          </div>
          <div class="stat-value">{{ stats().quizzes.averagePercent }}%</div>
          <div class="stat-label">{{ 'dash.quizAverage' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-light)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="stat-value">{{ stats().assignments.averageGrade }}</div>
          <div class="stat-label">{{ 'dash.avgAssignmentGrade' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fce7f3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          </div>
          <div class="stat-value">{{ stats().tickets.open }}</div>
          <div class="stat-label">{{ 'dash.openTickets' | t }}</div>
        </div>
      </div>

      <div class="metrics-grid">
        <!-- Attendance -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.attendance' | t }}</h3><span class="badge badge-ghost">{{ stats().attendance.totalSessions }} {{ 'dash.sessionsCount' | t }}</span></div>
          <div class="card-body">
            <div class="progress-wrap"><div class="progress-fill primary" [style.width]="stats().attendance.rate + '%'"></div></div>
            <p class="rate-label">{{ 'dash.attendanceRate' | t }}: <strong>{{ stats().attendance.rate }}%</strong></p>
            <div class="metric-row"><span class="metric-label joined">{{ 'dash.attended' | t }}</span><strong>{{ stats().attendance.attended }}</strong></div>
            <div class="metric-row"><span class="metric-label absent">{{ 'dash.missed' | t }}</span><strong>{{ stats().attendance.missed }}</strong></div>
          </div>
        </div>

        <!-- Quizzes -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.quizzes' | t }}</h3><span class="badge badge-ghost">{{ stats().quizzes.total }} {{ 'dash.total' | t }}</span></div>
          <div class="card-body">
            <div class="progress-wrap"><div class="progress-fill warning" [style.width]="stats().quizzes.averagePercent + '%'"></div></div>
            <p class="rate-label">{{ 'dash.averageScore' | t }}: <strong>{{ stats().quizzes.averagePercent }}%</strong> ({{ stats().quizzes.pointsObtained }}/{{ stats().quizzes.totalPoints }} {{ 'tq.pts' | t }})</p>
            <div class="metric-row"><span class="metric-label joined">{{ 'dash.taken' | t }}</span><strong>{{ stats().quizzes.taken }}</strong></div>
            <div class="metric-row"><span class="metric-label pending">{{ 'dash.pending' | t }}</span><strong>{{ stats().quizzes.pending }}</strong></div>
            <div class="metric-row"><span class="metric-label absent">{{ 'dash.missed' | t }}</span><strong>{{ stats().quizzes.missed }}</strong></div>
          </div>
        </div>

        <!-- Assignments -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.assignments' | t }}</h3><span class="badge badge-ghost">{{ stats().assignments.total }} {{ 'dash.total' | t }}</span></div>
          <div class="card-body">
            <div class="progress-wrap"><div class="progress-fill success" [style.width]="(stats().assignments.total>0 ? stats().assignments.submitted/stats().assignments.total*100 : 0) + '%'"></div></div>
            <p class="rate-label">{{ 'dash.avgGrade' | t }}: <strong>{{ stats().assignments.averageGrade }}</strong> ({{ stats().assignments.gradedCount }} {{ 'dash.graded' | t }})</p>
            <div class="metric-row"><span class="metric-label joined">{{ 'dash.submitted' | t }}</span><strong>{{ stats().assignments.submitted }}</strong></div>
            <div class="metric-row"><span class="metric-label pending">{{ 'dash.pending' | t }}</span><strong>{{ stats().assignments.pending }}</strong></div>
            <div class="metric-row"><span class="metric-label absent">{{ 'dash.missed' | t }}</span><strong>{{ stats().assignments.missed }}</strong></div>
          </div>
        </div>

        <!-- Upcoming Deadlines -->
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.upcomingDeadlines' | t }}</h3></div>
          <div class="card-body">
            <div *ngIf="!stats().upcomingDeadlines.length" class="empty-mini">{{ 'dash.noDeadlines' | t }}</div>
            <div *ngFor="let d of stats().upcomingDeadlines" class="deadline-row">
              <div class="deadline-icon" [class.quiz]="d.type==='quiz'" [class.assignment]="d.type==='assignment'">
                {{ d.type === 'quiz' ? '📝' : '📄' }}
              </div>
              <div class="deadline-info">
                <div class="deadline-title">{{ d.title }}</div>
                <div class="deadline-sub">{{ d.sessionName }} · {{ 'dash.due' | t }} {{ d.dueDate | cairoDate:'full' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown tables -->
      <div class="breakdown-grid">
        <div class="card">
          <div class="card-header"><h3>{{ 'dash.recentQuizResults' | t }}</h3></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>{{ 'dash.quiz' | t }}</th><th>{{ 'dash.session' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'dash.score' | t }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let q of stats().quizBreakdown">
                  <td>{{ q.title }}</td>
                  <td style="color:var(--text-muted);font-size:.8rem">{{ q.sessionName || '—' }}</td>
                  <td><span [ngClass]="statusBadgeClass(q.status)">{{ statusLabel(q.status) }}</span></td>
                  <td>
                    <strong *ngIf="q.score !== null" style="color:var(--success)">{{ q.score }}/{{ q.totalPoints }}</strong>
                    <span *ngIf="q.score === null" style="color:var(--text-muted)">—</span>
                  </td>
                </tr>
                <tr *ngIf="!stats().quizBreakdown.length"><td colspan="4" class="empty-state"><p>{{ 'dash.noQuizzesYet' | t }}</p></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>{{ 'dash.recentAssignResults' | t }}</h3></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>{{ 'dash.assignment' | t }}</th><th>{{ 'dash.session' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'dash.grade' | t }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of stats().assignmentBreakdown">
                  <td>{{ a.title }}</td>
                  <td style="color:var(--text-muted);font-size:.8rem">{{ a.sessionName || '—' }}</td>
                  <td><span [ngClass]="statusBadgeClass(a.status)">{{ statusLabel(a.status) }}</span></td>
                  <td>
                    <strong *ngIf="a.grade !== null" style="color:var(--success)">{{ a.grade }}</strong>
                    <span *ngIf="a.grade === null && a.status==='submitted'" style="color:var(--text-muted);font-size:.8rem">{{ 'dash.pending' | t }}</span>
                    <span *ngIf="a.grade === null && a.status!=='submitted'" style="color:var(--text-muted)">—</span>
                  </td>
                </tr>
                <tr *ngIf="!stats().assignmentBreakdown.length"><td colspan="4" class="empty-state"><p>{{ 'dash.noAssignmentsYet' | t }}</p></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .metrics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
    .metric-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);&:last-child{border:none;}}
    .metric-label{font-size:.875rem;color:var(--text-muted);display:flex;align-items:center;gap:8px;
      &::before{content:'';width:8px;height:8px;border-radius:50%;display:inline-block;}
      &.finished::before{background:var(--success);}&.pending::before{background:var(--warning);}
      &.running::before{background:var(--primary);}&.joined::before{background:var(--success);}
      &.absent::before{background:var(--danger);}
    }
    .progress-wrap{height:8px;background:var(--surface2);border-radius:999px;overflow:hidden;margin-bottom:8px;}
    .progress-fill{height:100%;border-radius:999px;transition:width .6s ease;&.primary{background:var(--primary);}&.success{background:var(--success);}&.warning{background:var(--warning);}}
    .rate-label{font-size:.8rem;color:var(--text-muted);margin-bottom:12px;}
    .gender-bar-wrap{display:flex;height:16px;border-radius:999px;overflow:hidden;margin-bottom:12px;}
    .g-male{background:var(--primary);}.g-female{background:#ec4899;}
    .gender-legend{display:flex;gap:16px;font-size:.875rem;color:var(--text-muted);}
    .dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-inline-end:6px;font-style:normal;&.male{background:var(--primary);}&.female{background:#ec4899;}}

    /* ── Student dashboard ── */
    .score-hero{display:flex;align-items:center;gap:32px;background:linear-gradient(135deg,var(--primary-light),var(--surface));border:1px solid var(--border);border-radius:16px;padding:28px 32px;margin-bottom:20px;flex-wrap:wrap;}
    .score-ring-wrap{position:relative;width:140px;height:140px;flex-shrink:0;}
    .score-ring{width:140px;height:140px;transform:rotate(-90deg);}
    .ring-bg{fill:none;stroke:var(--border);stroke-width:10;}
    .ring-fg{fill:none;stroke:var(--primary);stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset .8s ease;}
    .ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
    .ring-percent{font-size:1.6rem;font-weight:800;color:var(--text);}
    .ring-label{font-size:.75rem;color:var(--text-muted);font-weight:500;}
    .score-hero-details{flex:1;min-width:240px;}
    .score-hero-details h3{font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:4px;}
    .score-hero-sub{font-size:.85rem;color:var(--text-muted);margin-bottom:16px;}
    .score-points-row{display:flex;align-items:baseline;gap:14px;}
    .points-box{text-align:center;}
    .points-value{font-size:1.8rem;font-weight:800;color:var(--primary);line-height:1;}
    .points-value.muted{color:var(--text-muted);}
    .points-label{font-size:.72rem;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.03em;}
    .points-divider{font-size:1.6rem;color:var(--text-muted);font-weight:300;}

    .breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;}
    @media(max-width:900px){.breakdown-grid{grid-template-columns:1fr;}}

    .deadline-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);&:last-child{border:none;}}
    .deadline-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;background:var(--surface2);}
    .deadline-info{flex:1;min-width:0;}
    .deadline-title{font-size:.85rem;font-weight:600;color:var(--text);}
    .deadline-sub{font-size:.75rem;color:var(--text-muted);margin-top:2px;}
    .empty-mini{font-size:.85rem;color:var(--text-muted);text-align:center;padding:20px 0;}
  `]
})
export class DashboardComponent implements OnInit {
  private svc = inject(DashboardService);
  private langSvc = inject(LanguageService);
  stats = signal<any>(null);
  loading = signal(true);
  ngOnInit() {
    this.svc.getStats().subscribe({
      next: d => { this.stats.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
  statusBadgeClass(status: string) {
    return {
      submitted: 'badge badge-success',
      pending: 'badge badge-warning',
      missed: 'badge badge-danger'
    }[status] || 'badge badge-ghost';
  }
  statusLabel(status: string) {
    const key = { submitted: 'dash.statusSubmitted', pending: 'dash.statusPending', missed: 'dash.statusMissed' }[status];
    return key ? this.langSvc.translate(key) : status;
  }
}
