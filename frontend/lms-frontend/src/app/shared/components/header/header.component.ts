import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-btn" (click)="toggleTheme()" [title]="isDark() ? ('header.lightMode' | t) : ('header.darkMode' | t)">
          <svg *ngIf="isDark()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg *ngIf="!isDark()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="lang-btn" (click)="lang.toggle()" [title]="lang.lang() === 'en' ? 'العربية' : 'English'">
          {{ lang.lang() === 'en' ? 'العربية' : 'English' }}
        </button>
      </div>
      <div class="user-area">
        <div class="avatar">{{ auth.currentUser()?.name?.charAt(0) | uppercase }}</div>
        <div class="user-text">
          <span class="user-name">{{ auth.currentUser()?.name }}</span>
          <span class="role-chip" [class]="'role-' + auth.currentUser()?.role?.toLowerCase()">{{ 'role.' + auth.currentUser()?.role?.toLowerCase() | t }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar{height:64px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:50;}
    .topbar-left{display:flex;align-items:center;gap:8px;}
    .icon-btn{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px;cursor:pointer;color:var(--text);display:flex;align-items:center;transition:all .15s;svg{width:18px;height:18px;}&:hover{border-color:var(--primary);color:var(--primary);}}
    .lang-btn{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;cursor:pointer;color:var(--text);font-size:.8rem;font-weight:600;transition:all .15s;&:hover{border-color:var(--primary);color:var(--primary);}}
    .user-area{display:flex;align-items:center;gap:10px;}
    .avatar{width:36px;height:36px;background:linear-gradient(135deg,var(--primary),#7c3aed);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;}
    .user-text{display:flex;flex-direction:column;gap:2px;}
    .user-name{font-size:.875rem;font-weight:600;color:var(--text);}
    .role-chip{font-size:.7rem;padding:1px 8px;border-radius:999px;font-weight:600;width:fit-content;
      &.role-admin{background:#fef3c7;color:#d97706;}
      &.role-coordinator{background:var(--primary-light);color:var(--primary);}
      &.role-student{background:var(--success-light);color:var(--success);}
    }
  `]
})
export class HeaderComponent {
  auth = inject(AuthService);
  lang = inject(LanguageService);
  isDark = signal(document.documentElement.getAttribute('data-theme') === 'dark');
  toggleTheme() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }
}
