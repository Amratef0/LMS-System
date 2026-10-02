import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-my-report',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="page-header">
      <h1>{{ 'rpt.myReportTitle' | t }}</h1>
      <p>{{ 'rpt.myReportSubtitle' | t }}</p>
    </div>

    <div class="card" style="max-width:520px">
      <div class="card-body" style="text-align:center;padding:40px 24px">
        <div style="width:72px;height:72px;background:var(--primary-light);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.8" style="width:36px;height:36px">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>

        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">{{ 'rpt.studentProgressTitle' | t }}</h3>
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:6px">{{ auth.currentUser()?.name }}</p>
        <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:28px">{{ 'rpt.myReportInfo' | t }}</p>

        <div class="features-list">
          <div class="feature-row">
            <span class="feature-dot" style="background:var(--primary)"></span>
            {{ 'rpt.featureOverall' | t }}
          </div>
          <div class="feature-row">
            <span class="feature-dot" style="background:var(--success)"></span>
            {{ 'rpt.featureAttendance' | t }}
          </div>
          <div class="feature-row">
            <span class="feature-dot" style="background:var(--warning)"></span>
            {{ 'rpt.featureQuizzes' | t }}
          </div>
          <div class="feature-row">
            <span class="feature-dot" style="background:#db2777"></span>
            {{ 'rpt.featureAssignments' | t }}
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:24px;height:44px;font-size:.95rem" (click)="download()" [disabled]="downloading()">
          <span *ngIf="downloading()" class="btn-spinner"></span>
          <svg *ngIf="!downloading()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ downloading() ? ('rpt.generating' | t) : ('rpt.downloadMyReport' | t) }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .features-list { display:flex; flex-direction:column; gap:8px; text-align:start; background:var(--surface2); border-radius:10px; padding:14px 16px; }
    .feature-row { display:flex; align-items:center; gap:10px; font-size:.875rem; color:var(--text); }
    .feature-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class MyReportComponent {
  private rptSvc = inject(ReportService);
  private toast = inject(ToastService);
  auth = inject(AuthService);
  downloading = signal(false);

  download() {
    this.downloading.set(true);
    this.rptSvc.studentProgressReport().subscribe({
      next: (blob: Blob) => {
        this.downloading.set(false);
        const name = this.auth.currentUser()?.name?.replace(/\s+/g, '_') || 'Student';
        this.rptSvc.downloadBlob(blob, `Progress_${name}_${new Date().toISOString().slice(0,10)}.pdf`);
        this.toast.success('Report downloaded');
      },
      error: () => { this.downloading.set(false); this.toast.error('Could not generate report', 'Please try again.'); }
    });
  }
}
