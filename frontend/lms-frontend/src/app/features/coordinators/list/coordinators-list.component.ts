import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinatorService } from '../../../core/services/coordinator.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-coordinators-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <h1>{{ 'coord.title' | t }}</h1>
        <p>{{ 'coord.subtitle' | t }}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="form-control" [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="'coord.searchPlaceholder' | t" style="width:220px">
        </div>
        <button class="btn btn-primary" (click)="openCreate()">{{ 'coord.addCoordinator' | t }}</button>
      </div>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <div class="card" *ngIf="!loading()">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.name' | t }}</th>
              <th>{{ 'common.email' | t }}</th>
              <th>{{ 'common.phone' | t }}</th>
              <th>{{ 'coord.groups' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
              <th>{{ 'common.actions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of coordinators()">
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="av-sm">{{ c.name.charAt(0) }}</div>
                  <span style="font-weight:500">{{ c.name }}</span>
                </div>
              </td>
              <td style="font-size:.8rem">{{ c.email }}</td>
              <td>{{ c.phone || '—' }}</td>
              <td>
                <span class="badge badge-ghost">{{ c.groupsCount }}</span>
              </td>
              <td>
                <span [class]="c.isActive ? 'badge badge-success' : 'badge badge-danger'">
                  {{ c.isActive ? ('common.active' | t) : ('common.inactive' | t) }}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(c)">{{ 'common.edit' | t }}</button>
                  <button class="btn btn-ghost btn-sm" (click)="openPassReset(c)">🔑</button>
                  <button class="btn btn-ghost btn-sm" (click)="toggleStatus(c)">
                    {{ c.isActive ? ('coord.deactivate' | t) : ('coord.activate' | t) }}
                  </button>
                  <button
                    *ngIf="c.groupsCount === 0"
                    class="btn btn-sm"
                    style="background:var(--danger-light);color:var(--danger);border:none"
                    (click)="deleteCoordinator(c)">🗑</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!coordinators().length">
              <td colspan="6"><div class="empty-state"><p>{{ 'coord.noCoordinators' | t }}</p></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">{{ (page()-1)*10+1 }}-{{ min(page()*10, total()) }} / {{ total() }}</span>
        <button (click)="goPage(page()-1)" [disabled]="page()===1">‹</button>
        <button *ngFor="let p of pages()" [class.active]="p===page()" (click)="goPage(p)">{{ p }}</button>
        <button (click)="goPage(page()+1)" [disabled]="page()>=totalPages()">›</button>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal-backdrop" *ngIf="showCreate()" (click)="showCreate.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ 'coord.addTitle' | t }}</h3>
          <button class="btn btn-ghost btn-sm btn-icon" (click)="showCreate.set(false)">✕</button>
        </div>
        <div class="form-group">
          <label>{{ 'common.name' | t }} *</label>
          <input class="form-control" [(ngModel)]="createForm.name" [placeholder]="'coord.namePlaceholder' | t">
        </div>
        <div class="form-group">
          <label>{{ 'common.email' | t }} *</label>
          <input type="email" class="form-control" [(ngModel)]="createForm.email" placeholder="coordinator@example.com">
        </div>
        <div class="form-group">
          <label>{{ 'stu.password' | t }} *</label>
          <input type="password" class="form-control" [(ngModel)]="createForm.password" [placeholder]="'coord.passwordPlaceholder' | t">
        </div>
        <div class="form-group">
          <label>{{ 'common.phone' | t }}</label>
          <input class="form-control" [(ngModel)]="createForm.phone" placeholder="01xxxxxxxxx">
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showCreate.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="create()" [disabled]="!createForm.name || !createForm.email || !createForm.password">
            {{ 'coord.addCoordinator' | t }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-backdrop" *ngIf="showEdit()" (click)="showEdit.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ 'coord.editTitle' | t }}</h3>
          <button class="btn btn-ghost btn-sm btn-icon" (click)="showEdit.set(false)">✕</button>
        </div>
        <div class="form-group">
          <label>{{ 'common.name' | t }} *</label>
          <input class="form-control" [(ngModel)]="editForm.name">
        </div>
        <div class="form-group">
          <label>{{ 'common.email' | t }}</label>
          <input type="email" class="form-control" [(ngModel)]="editForm.email">
        </div>
        <div class="form-group">
          <label>{{ 'common.phone' | t }}</label>
          <input class="form-control" [(ngModel)]="editForm.phone">
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showEdit.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveEdit()" [disabled]="!editForm.name">
            {{ 'common.saveChanges' | t }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div class="modal-backdrop" *ngIf="showPass()" (click)="showPass.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ 'stu.changePassword' | t }}</h3>
          <button class="btn btn-ghost btn-sm btn-icon" (click)="showPass.set(false)">✕</button>
        </div>
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">
          <strong>{{ selectedCoord?.name }}</strong>
        </p>
        <div class="form-group">
          <label>{{ 'stu.newPassword' | t }}</label>
          <input type="password" class="form-control" [(ngModel)]="newPassword" [placeholder]="'coord.passwordPlaceholder' | t">
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showPass.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="savePassword()" [disabled]="!newPassword">
            {{ 'stu.updatePassword' | t }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .av-sm{width:30px;height:30px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0;}
  `]
})
export class CoordinatorsListComponent implements OnInit {
  private svc = inject(CoordinatorService);
  private toast = inject(ToastService);

  coordinators = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  search = '';

  showCreate = signal(false);
  showEdit = signal(false);
  showPass = signal(false);

  selectedCoord: any = null;
  createForm: any = { name: '', email: '', password: '', phone: '' };
  editForm: any = { name: '', email: '', phone: '' };
  newPassword = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getCoordinators({ search: this.search, page: this.page(), pageSize: 10 }).subscribe({
      next: r => { this.coordinators.set(r.items); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.page.set(1); this.load(); }
  goPage(p: number) { this.page.set(p); this.load(); }

  openCreate() {
    this.createForm = { name: '', email: '', password: '', phone: '' };
    this.showCreate.set(true);
  }

  create() {
    this.svc.createCoordinator(this.createForm).subscribe({
      next: () => { this.showCreate.set(false); this.load(); this.toast.success('Coordinator added'); },
      error: e => this.toast.error('Could not add coordinator', e.error?.message)
    });
  }

  openEdit(c: any) {
    this.selectedCoord = c;
    this.editForm = { name: c.name, email: c.email, phone: c.phone || '' };
    this.showEdit.set(true);
  }

  saveEdit() {
    this.svc.updateCoordinator(this.selectedCoord.id, this.editForm).subscribe({
      next: () => { this.showEdit.set(false); this.load(); this.toast.success('Coordinator updated'); },
      error: e => this.toast.error('Could not update coordinator', e.error?.message)
    });
  }

  openPassReset(c: any) {
    this.selectedCoord = c;
    this.newPassword = '';
    this.showPass.set(true);
  }

  savePassword() {
    this.svc.resetPassword(this.selectedCoord.id, this.newPassword).subscribe({
      next: () => { this.showPass.set(false); this.toast.success('Password updated'); },
      error: e => this.toast.error('Could not update password', e.error?.message)
    });
  }

  toggleStatus(c: any) {
    this.svc.toggleStatus(c.id).subscribe({
      next: (res: any) => { this.load(); this.toast.success(res.isActive ? 'Coordinator activated' : 'Coordinator deactivated'); },
      error: e => this.toast.error('Could not update status', e.error?.message)
    });
  }

  deleteCoordinator(c: any) {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    this.svc.deleteCoordinator(c.id).subscribe({
      next: () => { this.load(); this.toast.success('Coordinator deleted'); },
      error: e => this.toast.error('Could not delete coordinator', e.error?.message)
    });
  }

  totalPages() { return Math.ceil(this.total() / 10); }
  pages() { const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); }
  min(a: number, b: number) { return Math.min(a, b); }
}
