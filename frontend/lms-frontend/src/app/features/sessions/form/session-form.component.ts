import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { GroupService } from '../../../core/services/group.service';
import { InstructorService } from '../../../core/services/instructor.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;align-items:center;gap:12px">
      <a routerLink="/sessions" class="btn btn-ghost btn-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M15 18l-6-6 6-6"/></svg>
        Back
      </a>
      <div>
        <h1>{{ isEdit ? ('sf.editTitle' | t) : ('sf.addTitle' | t) }}</h1>
        <p>{{ isEdit ? ('sf.editSubtitle' | t) : ('sf.addSubtitle' | t) }}</p>
      </div>
    </div>

    <div class="card" style="max-width:640px">
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>{{ 'sf.sessionName' | t }} *</label>
            <input class="form-control" [(ngModel)]="form.name" placeholder="{{ 'sf.namePlaceholder' | t }}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>{{ 'sf.group' | t }} *</label>
            <select class="form-control" [(ngModel)]="form.groupId">
              <option value="">{{ 'sf.selectGroup' | t }}</option>
              <option *ngFor="let g of groups()" [value]="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>{{ 'sf.instructor' | t }} *</label>
            <select class="form-control" [(ngModel)]="form.trainerId">
              <option value="">{{ 'sf.selectInstructor' | t }}</option>
              <option *ngFor="let i of instructors()" [value]="i.id">{{ i.name }}</option>
            </select>
            <p *ngIf="!instructors().length" class="hint-text">
              {{ 'sf.noInstructors' | t }} <a routerLink="/instructors">{{ 'sf.addOneHere' | t }}</a>
            </p>
          </div>
          <div class="form-group">
            <label>{{ 'common.date' | t }} *</label>
            <input type="date" class="form-control" [(ngModel)]="sessionDate">
          </div>
          <div class="form-group">
            <label>{{ 'common.time' | t }} *</label>
            <input type="time" class="form-control" [(ngModel)]="sessionTime">
          </div>
          <div class="form-group">
            <label>{{ 'common.type' | t }} *</label>
            <select class="form-control" [(ngModel)]="form.type">
              <option value="live">{{ 'sf.liveSession' | t }}</option>
              <option value="physical">{{ 'sf.physicalSession' | t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ 'sess.topic' | t }} *</label>
            <select class="form-control" [(ngModel)]="form.topic">
              <option value="technical">{{ 'sf.technical' | t }}</option>
              <option value="soft skill">{{ 'sf.softSkill' | t }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1" *ngIf="form.type==='physical'">
            <label>{{ 'sf.location' | t }}</label>
            <input class="form-control" [(ngModel)]="form.location" placeholder="e.g. Cairo Hub, Room 201">
          </div>
          <div class="form-group" style="grid-column:1/-1" *ngIf="form.type==='live'">
            <label>{{ 'sf.recordLink' | t }}</label>
            <input class="form-control" [(ngModel)]="form.recordLink" placeholder="https://zoom.us/rec/...">
          </div>
        </div>

        <div class="error-msg" *ngIf="error()">{{ error() }}</div>

        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
            <span *ngIf="saving()" style="width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block"></span>
            {{ saving() ? ('common.loading' | t) : (isEdit ? ('sf.updating' | t) : ('sf.creating' | t)) }}
          </button>
          <a routerLink="/sessions" class="btn btn-ghost">{{ 'common.cancel' | t }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;} .error-msg{background:var(--danger-light);color:var(--danger);padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:12px;} .hint-text{font-size:.78rem;color:var(--text-muted);margin-top:6px;a{color:var(--primary);font-weight:500;}}`]
})
export class SessionFormComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private groupSvc = inject(GroupService);
  private instructorSvc = inject(InstructorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isEdit = false;
  sessionId: number | null = null;
  groups = signal<any[]>([]);
  instructors = signal<any[]>([]);
  saving = signal(false);
  error = signal('');
  sessionDate = '';
  sessionTime = '09:00';

  form: any = { name:'', groupId:'', trainerId:'', type:'live', topic:'technical', location:'', recordLink:'' };

  ngOnInit() {
    this.sessionId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    this.isEdit = !!this.sessionId;
    this.loadGroups();
    this.loadInstructors();
    if (this.isEdit) this.loadSession();
  }

  loadGroups() {
    this.groupSvc.getGroups({ pageSize: 100 }).subscribe(r => this.groups.set(r.items));
  }

  loadInstructors() {
    this.instructorSvc.getInstructors({ activeOnly: true, pageSize: 100 }).subscribe(r => this.instructors.set(r.items));
  }

  loadSession() {
    this.sessionSvc.getSession(this.sessionId!).subscribe(s => {
      this.form = { name: s.name, groupId: s.group.id, trainerId: s.trainer.id, type: s.type, topic: s.topic, location: s.location||'', recordLink: s.recordLink||'' };
      // Date object automatically converts the UTC string from the API into local device time
      const d = new Date(s.sessionDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      this.sessionDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      this.sessionTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
  }

  save() {
    if (!this.form.name || !this.form.groupId || !this.form.trainerId || !this.sessionDate) {
      this.error.set('Please fill all required fields'); return;
    }
    this.saving.set(true); this.error.set('');
    // The date/time inputs are in the device's local timezone; the Date constructor + toISOString()
    // correctly convert that to UTC for storage, exactly like any standard website.
    const sessionDate = new Date(`${this.sessionDate}T${this.sessionTime}:00`).toISOString();
    const payload = { ...this.form, sessionDate, groupId: +this.form.groupId, trainerId: +this.form.trainerId };

    const obs = this.isEdit
      ? this.sessionSvc.updateSession(this.sessionId!, payload)
      : this.sessionSvc.createSession(payload);

    obs.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Session updated' : 'Session created'); this.router.navigate(['/sessions']); },
      error: e => { this.error.set(e.error?.message || 'sf.error'); this.saving.set(false); }
    });
  }
}
