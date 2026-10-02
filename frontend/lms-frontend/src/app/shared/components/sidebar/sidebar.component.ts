import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-logo">
        <div class="logo-icon">L</div>
        <span class="logo-text" *ngIf="!collapsed()">LMS Pro</span>
        <button class="collapse-btn" (click)="collapsed.set(!collapsed())">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path [attr.d]="collapseArrowPath()"/></svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.dashboard' | t) : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span *ngIf="!collapsed()">{{ 'sidebar.dashboard' | t }}</span>
        </a>

        <a routerLink="/sessions" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.sessions' | t) : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span *ngIf="!collapsed()">{{ 'sidebar.sessions' | t }}</span>
        </a>

        <a routerLink="/tickets" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.tickets' | t) : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          <span *ngIf="!collapsed()">{{ 'sidebar.tickets' | t }}</span>
        </a>

        <ng-container *ngIf="!isStudent()">
          <a routerLink="/groups" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.groups' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.groups' | t }}</span>
          </a>
          <a *ngIf="isAdmin()" routerLink="/instructors" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.instructors' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.instructors' | t }}</span>
          </a>
          <a *ngIf="isAdmin()" routerLink="/coordinators" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.coordinators' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="10" x2="19" y2="16"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.coordinators' | t }}</span>
          </a>
          <a routerLink="/students" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.students' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.students' | t }}</span>
          </a>
          <a routerLink="/quizzes" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.quizzes' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.quizzes' | t }}</span>
          </a>
          <a routerLink="/assignments" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.assignments' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.assignments' | t }}</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.reports' | t) : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            <span *ngIf="!collapsed()">{{ 'sidebar.reports' | t }}</span>
          </a>
        </ng-container>

        <!-- Student: My Report link -->
        <a *ngIf="isStudent()" routerLink="/my-report" routerLinkActive="active" class="nav-item" [title]="collapsed() ? ('sidebar.myReport' | t) : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <span *ngIf="!collapsed()">{{ 'sidebar.myReport' | t }}</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <div *ngIf="!collapsed()" class="user-mini">
          <div class="avatar-mini">{{ auth.currentUser()?.name?.charAt(0) }}</div>
          <div>
            <div class="user-mini-name">{{ auth.currentUser()?.name }}</div>
            <div class="user-mini-role">{{ 'role.' + auth.currentUser()?.role?.toLowerCase() | t }}</div>
          </div>
        </div>
        <button class="nav-item logout-btn" (click)="auth.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span *ngIf="!collapsed()">{{ 'sidebar.logout' | t }}</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar{position:fixed;inset-inline-start:0;top:0;bottom:0;width:var(--sidebar-w);background:var(--surface);border-inline-end:1px solid var(--border);display:flex;flex-direction:column;z-index:100;transition:width .25s ease;overflow:hidden;}
    .sidebar.collapsed{width:68px;}
    .sidebar-logo{display:flex;align-items:center;gap:12px;padding:20px 16px;border-bottom:1px solid var(--border);min-height:72px;}
    .logo-icon{width:36px;height:36px;background:var(--primary);color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;flex-shrink:0;}
    .logo-text{font-size:1.1rem;font-weight:700;color:var(--text);white-space:nowrap;}
    .collapse-btn{margin-inline-start:auto;background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;border-radius:6px;display:flex;svg{width:18px;height:18px;}&:hover{background:var(--surface2);}}
    .sidebar-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;}
    .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:var(--text-muted);font-size:.9rem;font-weight:500;transition:all .15s;cursor:pointer;background:none;border:none;width:100%;text-align:start;
      svg{width:20px;height:20px;flex-shrink:0;}
      &:hover{background:var(--surface2);color:var(--text);}
      &.active{background:var(--primary-light);color:var(--primary);font-weight:600;}}
    .sidebar-footer{padding:12px 8px;border-top:1px solid var(--border);}
    .user-mini{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:4px;}
    .avatar-mini{width:32px;height:32px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700;flex-shrink:0;}
    .user-mini-name{font-size:.85rem;font-weight:600;color:var(--text);}
    .user-mini-role{font-size:.75rem;color:var(--text-muted);}
    .logout-btn{color:var(--danger)!important;&:hover{background:var(--danger-light)!important;}}
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);
  lang = inject(LanguageService);
  collapsed = signal(false);
  isStudent() { return this.auth.getRole() === 'Student'; }
  isAdmin() { return this.auth.getRole() === 'Admin'; }

  // The collapse arrow must visually flip depending on language direction,
  // since "collapsed" always means "toward the edge" regardless of LTR/RTL.
  collapseArrowPath() {
    const isRtl = this.lang.lang() === 'ar';
    if (this.collapsed()) {
      return isRtl ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6';
    }
    return isRtl ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6';
  }
}
