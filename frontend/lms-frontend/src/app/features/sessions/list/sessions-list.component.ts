import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CairoDatePipe } from '../../../shared/pipes/cairo-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CairoDatePipe, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1>{{ 'sess.title' | t }}</h1>
        <p>{{ 'sess.subtitle' | t }}</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="form-control" [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="'sess.searchPlaceholder' | t" style="width:240px">
        </div>
        <button class="filter-btn" (click)="showFilter.set(!showFilter())">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filter <span *ngIf="activeFilters()>0" class="badge badge-primary" style="padding:1px 6px;margin-left:2px">{{ activeFilters() }}</span>
        </button>
        <a *ngIf="isAdmin()" routerLink="/sessions/new" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Session
        </a>
      </div>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel card" *ngIf="showFilter()">
      <div class="card-body">
        <div class="filter-grid">
          <div class="form-group"><label>Status</label>
            <select class="form-control" [(ngModel)]="filters.status">
              <option value="">{{ 'common.all' | t }}</option><option value="pending">Pending</option><option value="running">Running</option><option value="finished">Finished</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="form-group"><label>Type</label>
            <select class="form-control" [(ngModel)]="filters.type">
              <option value="">{{ 'common.all' | t }}</option><option value="live">Live</option><option value="physical">Physical</option>
            </select>
          </div>
          <div class="form-group"><label>Topic</label>
            <select class="form-control" [(ngModel)]="filters.topic">
              <option value="">{{ 'common.all' | t }}</option><option value="technical">Technical</option><option value="soft skill">Soft Skill</option>
            </select>
          </div>
          <div class="form-group"><label>Date From</label><input type="date" class="form-control" [(ngModel)]="filters.dateFrom"></div>
          <div class="form-group"><label>Date To</label><input type="date" class="form-control" [(ngModel)]="filters.dateTo"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn btn-primary btn-sm" (click)="applyFilters()">Apply</button>
          <button class="btn btn-ghost btn-sm" (click)="resetFilters()">Reset All</button>
        </div>
      </div>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <div class="card" *ngIf="!loading()">
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>{{ 'common.name' | t }}</th><th>{{ 'sess.instructor' | t }}</th><th>{{ 'common.date' | t }}</th><th>{{ 'sess.group' | t }}</th><th>{{ 'common.type' | t }}</th><th>{{ 'sess.topic' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'sess.link' | t }}</th><th></th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let s of sessions()">
              <td><a [routerLink]="['/sessions', s.id]" class="link-blue">{{ s.name }}</a></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="av-sm">{{ s.trainer.name.charAt(0) }}</div>
                  <span>{{ s.trainer.name }}</span>
                </div>
              </td>
              <td style="white-space:nowrap">{{ s.sessionDate | cairoDate:'short' }}<br><small style="color:var(--text-muted)">{{ s.sessionDate | cairoDate:'time' }}</small></td>
              <td><span class="badge badge-ghost">{{ s.group.code }}</span></td>
              <td><span [class]="'type-' + s.type">{{ s.type === 'live' ? ('sf.liveSession' | t) : ('sf.physicalSession' | t) }}</span></td>
              <td><span class="topic-lbl">{{ s.topic === 'technical' ? ('sf.technical' | t) : ('sf.softSkill' | t) }}</span></td>
              <td><span [class]="statusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
              <td>
                <a *ngIf="s.recordLink" [href]="s.recordLink" target="_blank" class="btn btn-ghost btn-sm" style="white-space:nowrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  View Record
                </a>
                <a *ngIf="s.location && !s.recordLink" [href]="'https://maps.google.com/?q='+s.location" target="_blank" class="btn btn-ghost btn-sm">📍 Location</a>
              </td>
              <td>
                <div style="display:flex;gap:4px">
                  <a [routerLink]="['/sessions', s.id]" class="btn btn-ghost btn-sm">{{ 'sess.details' | t }}</a>
                  <a *ngIf="canEdit()" [routerLink]="['/sessions', s.id, 'edit']" class="btn btn-ghost btn-sm">{{ 'common.edit' | t }}</a>
                </div>
              </td>
            </tr>
            <tr *ngIf="sessions().length===0"><td colspan="9"><div class="empty-state"><p>{{ 'sess.noSessions' | t }}</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">Showing {{ (page()-1)*pageSize+1 }}-{{ min(page()*pageSize, total()) }} of {{ total() }} items</span>
        <button (click)="goPage(page()-1)" [disabled]="page()===1">‹</button>
        <button *ngFor="let p of pages()" [class.active]="p===page()" (click)="goPage(p)">{{ p }}</button>
        <button (click)="goPage(page()+1)" [disabled]="page()>=totalPages()">›</button>
      </div>
    </div>
  `,
  styles: [`
    .filter-panel{margin-bottom:16px;}.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;}
    .av-sm{width:28px;height:28px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0;}
    .link-blue{color:var(--primary);font-weight:500;&:hover{text-decoration:underline;}}
    .type-live{color:var(--primary);font-size:.875rem;font-weight:500;}
    .type-physical{color:var(--warning);font-size:.875rem;font-weight:500;}
    .topic-lbl{color:var(--info);font-size:.875rem;}
  `]
})
export class SessionsListComponent implements OnInit {
  private svc = inject(SessionService);
  private auth = inject(AuthService);
  private langSvc = inject(LanguageService);
  sessions = signal<any[]>([]); loading = signal(true);
  total = signal(0); page = signal(1); pageSize = 10;
  search = ''; showFilter = signal(false);
  filters: any = { status:'', type:'', topic:'', dateFrom:'', dateTo:'' };

  isAdmin() { return this.auth.getRole()==='Admin'; }
  canEdit() { const r=this.auth.getRole(); return r==='Admin'||r==='Coordinator'; }

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    const params = { search:this.search, page:this.page(), pageSize:this.pageSize, ...this.filters };
    this.svc.getSessions(params).subscribe({ next:r=>{ this.sessions.set(r.items); this.total.set(r.total); this.loading.set(false); }, error:()=>this.loading.set(false) });
  }
  onSearch() { this.page.set(1); this.load(); }
  applyFilters() { this.page.set(1); this.showFilter.set(false); this.load(); }
  resetFilters() { this.filters={status:'',type:'',topic:'',dateFrom:'',dateTo:''}; this.applyFilters(); }
  activeFilters() { return Object.values(this.filters).filter((v:any)=>v!=='').length; }
statusClass(s: string) {
  return {
    finished: 'status-finished',
    pending: 'status-pending',
    running: 'status-running',
    cancelled: 'status-cancelled'
  }[s] || 'badge badge-ghost';
}  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages() { return Math.ceil(this.total()/this.pageSize); }
  pages() { const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); }
  min(a:number,b:number){return Math.min(a,b);}
  statusLabel(status: string): string {
  return {
    pending: 'Pending',
    running: 'Running',
    finished: 'Finished',
    cancelled: 'Cancelled'
  }[status] || status;
}
}
