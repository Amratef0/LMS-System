import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService } from '../../../core/services/instructor.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-instructors-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div><h1>{{ 'ins.title' | t }}</h1><p>{{ 'ins.subtitle' | t }}</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="form-control" [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="'ins.searchPlaceholder' | t" style="width:220px">
        </div>
        <button class="btn btn-primary" (click)="openCreate()">{{ 'ins.addInstructor' | t }}</button>
      </div>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <div class="card" *ngIf="!loading()">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>{{ 'common.name' | t }}</th><th>{{ 'common.email' | t }}</th><th>{{ 'common.phone' | t }}</th><th>{{ 'ins.bio' | t }}</th><th>{{ 'ins.sessions' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let i of instructors()">
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="av-sm">{{ i.name.charAt(0) }}</div>
                  <span style="font-weight:500">{{ i.name }}</span>
                </div>
              </td>
              <td style="font-size:.8rem">{{ i.email || '-' }}</td>
              <td>{{ i.phone || '-' }}</td>
              <td style="font-size:.8rem;color:var(--text-muted);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ i.bio || '-' }}</td>
              <td><span class="badge badge-ghost">{{ i.sessionsCount }}</span></td>
              <td><span [class]="i.isActive ? 'badge badge-success' : 'badge badge-danger'">{{ i.isActive ? ('common.active' | t) : ('common.inactive' | t) }}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(i)">{{ 'common.edit' | t }}</button>
                  <button class="btn btn-ghost btn-sm" (click)="toggleStatus(i)">{{ i.isActive ? ('ins.deactivate' | t) : ('ins.activate' | t) }}</button>
                  <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" (click)="deleteInstructor(i)" *ngIf="i.sessionsCount === 0">🗑</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!instructors().length"><td colspan="7"><div class="empty-state"><p>{{ 'ins.noInstructors' | t }}</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">Showing {{ (page()-1)*10+1 }}-{{ min(page()*10, total()) }} of {{ total() }} items</span>
        <button (click)="goPage(page()-1)" [disabled]="page()===1">‹</button>
        <button *ngFor="let p of pages()" [class.active]="p===page()" (click)="goPage(p)">{{ p }}</button>
        <button (click)="goPage(page()+1)" [disabled]="page()>=totalPages()">›</button>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal()" (click)="showModal.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ editing ? ('ins.editTitle' | t) : ('ins.addTitle' | t) }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showModal.set(false)">✕</button></div>
        <div class="form-group"><label>{{ 'common.name' | t }} *</label><input class="form-control" [(ngModel)]="form.name" [placeholder]="'ins.namePlaceholder' | t"></div>
        <div class="form-group"><label>{{ 'common.email' | t }}</label><input type="email" class="form-control" [(ngModel)]="form.email" [placeholder]="'common.email' | t"></div>
        <div class="form-group"><label>{{ 'common.phone' | t }}</label><input class="form-control" [(ngModel)]="form.phone" [placeholder]="'common.phone' | t"></div>
        <div class="form-group"><label>{{ 'ins.bio' | t }}</label><textarea class="form-control" [(ngModel)]="form.bio" rows="2" [placeholder]="'ins.bioPlaceholder' | t"></textarea></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="!form.name">{{ editing ? ('common.saveChanges' | t) : ('ins.addBtn' | t) }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .av-sm{width:30px;height:30px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0;}
  `]
})
export class InstructorsListComponent implements OnInit {
  private svc = inject(InstructorService);
  private toast = inject(ToastService);

  instructors = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  search = '';

  showModal = signal(false);
  editing: any = null;
  form: any = { name: '', email: '', phone: '', bio: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getInstructors({ search: this.search, page: this.page(), pageSize: 10 }).subscribe({
      next: r => { this.instructors.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.page.set(1); this.load(); }

  openCreate() { this.editing = null; this.form = { name: '', email: '', phone: '', bio: '' }; this.showModal.set(true); }
  openEdit(i: any) { this.editing = i; this.form = { name: i.name, email: i.email || '', phone: i.phone || '', bio: i.bio || '' }; this.showModal.set(true); }

  save() {
    const obs = this.editing ? this.svc.updateInstructor(this.editing.id, this.form) : this.svc.createInstructor(this.form);
    obs.subscribe({
      next: () => { this.showModal.set(false); this.load(); this.toast.success(this.editing ? 'Instructor updated' : 'Instructor added'); },
      error: e => this.toast.error('Could not save instructor', e.error?.message)
    });
  }

  toggleStatus(i: any) {
    this.svc.toggleStatus(i.id).subscribe({
      next: (res: any) => { this.load(); this.toast.success(res.isActive ? 'Instructor activated' : 'Instructor deactivated'); },
      error: e => this.toast.error('Could not update status', e.error?.message)
    });
  }

  deleteInstructor(i: any) {
    if (!confirm(`Delete ${i.name}? This cannot be undone.`)) return;
    this.svc.deleteInstructor(i.id).subscribe({
      next: () => { this.load(); this.toast.success('Instructor deleted'); },
      error: e => this.toast.error('Could not delete instructor', e.error?.message)
    });
  }

  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages() { return Math.ceil(this.total() / 10); }
  pages() { const t = this.totalPages(), c = this.page(), s = Math.max(1, c - 2), e = Math.min(t, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); }
  min(a: number, b: number) { return Math.min(a, b); }
}
