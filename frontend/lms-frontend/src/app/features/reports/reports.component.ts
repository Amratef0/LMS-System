import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { GroupService } from '../../core/services/group.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page-header">
      <h1>{{ 'rpt.title' | t }}</h1>
      <p>{{ 'rpt.subtitle' | t }}</p>
    </div>

    <!-- Group selector -->
    <div class="card" style="margin-bottom:20px;max-width:400px">
      <div class="card-header"><strong>{{ 'rpt.selectGroup' | t }}</strong></div>
      <div class="card-body">
        <select class="form-control" [(ngModel)]="selectedGroupId" (ngModelChange)="onGroupChange()">
          <option value="">{{ 'rpt.chooseGroup' | t }}</option>
          <option *ngFor="let g of groups()" [value]="g.id">{{ g.name }}</option>
        </select>
      </div>
    </div>

    <!-- Excel Reports (Admin/Coordinator) -->
    <div class="reports-grid" *ngIf="selectedGroupId">

      <!-- Attendance -->
      <div class="report-card">
        <div class="report-icon" style="background:#dbeafe">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="report-info">
          <h3>{{ 'rpt.attendanceTitle' | t }}</h3>
          <p>{{ 'rpt.attendanceDesc' | t }}</p>
        </div>
        <button class="btn btn-primary" (click)="downloadAttendance()" [disabled]="downloading['att']">
          <span *ngIf="downloading['att']" class="btn-spinner"></span>
          <svg *ngIf="!downloading['att']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ downloading['att'] ? ('rpt.generating' | t) : ('rpt.downloadExcel' | t) }}
        </button>
      </div>

      <!-- Grades -->
      <div class="report-card">
        <div class="report-icon" style="background:#dcfce7">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="report-info">
          <h3>{{ 'rpt.gradesTitle' | t }}</h3>
          <p>{{ 'rpt.gradesDesc' | t }}</p>
        </div>
        <button class="btn btn-primary" (click)="downloadGrades()" [disabled]="downloading['grades']">
          <span *ngIf="downloading['grades']" class="btn-spinner"></span>
          <svg *ngIf="!downloading['grades']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ downloading['grades'] ? ('rpt.generating' | t) : ('rpt.downloadExcel' | t) }}
        </button>
      </div>

      <!-- Group Summary -->
      <div class="report-card">
        <div class="report-icon" style="background:#fef3c7">
          <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <div class="report-info">
          <h3>{{ 'rpt.summaryTitle' | t }}</h3>
          <p>{{ 'rpt.summaryDesc' | t }}</p>
        </div>
        <button class="btn btn-primary" (click)="downloadSummary()" [disabled]="downloading['summary']">
          <span *ngIf="downloading['summary']" class="btn-spinner"></span>
          <svg *ngIf="!downloading['summary']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ downloading['summary'] ? ('rpt.generating' | t) : ('rpt.downloadExcel' | t) }}
        </button>
      </div>
    </div>

    <!-- Student PDF Reports (Admin only, pick a student) -->
    <div class="card" style="margin-top:24px" *ngIf="selectedGroupId">
      <div class="card-header">
        <strong>{{ 'rpt.studentProgressTitle' | t }}</strong>
        <span class="badge badge-primary" style="font-size:.72rem">PDF</span>
      </div>
      <div class="card-body">
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">{{ 'rpt.studentProgressDesc' | t }}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:220px;margin-bottom:0">
            <label>{{ 'rpt.selectStudent' | t }}</label>
            <select class="form-control" [(ngModel)]="selectedStudentId">
              <option value="">{{ 'rpt.chooseStudent' | t }}</option>
              <option *ngFor="let s of students()" [value]="s.id">{{ s.name }} ({{ s.studentCode }})</option>
            </select>
          </div>
          <button class="btn btn-primary" style="flex-shrink:0" (click)="downloadStudentPdf()" [disabled]="!selectedStudentId || downloading['pdf']">
            <span *ngIf="downloading['pdf']" class="btn-spinner"></span>
            <svg *ngIf="!downloading['pdf']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ downloading['pdf'] ? ('rpt.generating' | t) : ('rpt.downloadPdf' | t) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div *ngIf="!selectedGroupId" class="empty-state" style="margin-top:40px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;opacity:.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>{{ 'rpt.selectGroupFirst' | t }}</p>
    </div>
  `,
  styles: [`
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .report-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 20px; display: flex; flex-direction: column; gap: 12px;
    }
    .report-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; svg { width: 22px; height: 22px; } }
    .report-info h3 { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .report-info p { font-size: .8rem; color: var(--text-muted); line-height: 1.5; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent implements OnInit {
  private rptSvc = inject(ReportService);
  private groupSvc = inject(GroupService);
  private studentSvc = inject(StudentService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  groups = signal<any[]>([]);
  students = signal<any[]>([]);
  selectedGroupId = '';
  selectedStudentId = '';
  downloading: Record<string, boolean> = {};

  ngOnInit() {
    this.groupSvc.getGroups({ pageSize: 100 }).subscribe(r => this.groups.set(r.items));
  }

  onGroupChange() {
    this.selectedStudentId = '';
    this.students.set([]);
    if (this.selectedGroupId) {
      this.studentSvc.getStudents({ groupId: this.selectedGroupId, pageSize: 200 }).subscribe(r => this.students.set(r.items));
    }
  }

  private dl(key: string, obs$: any, filename: string) {
    this.downloading[key] = true;
    obs$.subscribe({
      next: (blob: Blob) => {
        this.downloading[key] = false;
        this.rptSvc.downloadBlob(blob, filename);
        this.toast.success('Report downloaded');
      },
      error: () => { this.downloading[key] = false; this.toast.error('Could not generate report', 'Please try again.'); }
    });
  }

  downloadAttendance() {
    this.dl('att', this.rptSvc.attendanceReport(+this.selectedGroupId),
      `Attendance_${Date.now()}.xlsx`);
  }
  downloadGrades() {
    this.dl('grades', this.rptSvc.gradesReport(+this.selectedGroupId),
      `Grades_${Date.now()}.xlsx`);
  }
  downloadSummary() {
    this.dl('summary', this.rptSvc.groupSummaryReport(+this.selectedGroupId),
      `GroupSummary_${Date.now()}.xlsx`);
  }
  downloadStudentPdf() {
    this.dl('pdf', this.rptSvc.studentProgressReport(+this.selectedStudentId),
      `Progress_${Date.now()}.pdf`);
  }
}
