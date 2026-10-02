import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="login-page">
      <button class="lang-switch" (click)="lang.toggle()">
        {{ lang.lang() === 'en' ? 'العربية' : 'English' }}
      </button>
      <div class="login-card">
        <div class="login-logo">
<img src="assets/logo.jpg" class="logo-img" alt="logo">          <h1>{{ 'login.title' | t }}</h1>
        </div>
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label>{{ 'login.email' | t }}</label>
            <input type="email" class="form-control" [(ngModel)]="email" name="email" [placeholder]="'login.emailPlaceholder' | t" required />
          </div>
          <div class="form-group">
            <label>{{ 'login.password' | t }}</label>
            <div style="position:relative">
              <input [type]="showPass() ? 'text' : 'password'" class="form-control" [(ngModel)]="password" name="password" [placeholder]="'login.passwordPlaceholder' | t" required />
              <button type="button" class="pass-toggle" (click)="showPass.set(!showPass())">
                <svg *ngIf="!showPass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPass()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>
          <div class="error-msg" *ngIf="error()">{{ error() }}</div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            <span *ngIf="loading()" class="btn-spinner"></span>
            {{ loading() ? ('login.signingIn' | t) : ('login.signIn' | t) }}
          </button>
        </form>
        <div class="demo-accounts">
          <p>{{ 'login.demoAccounts' | t }}</p>
          <div class="demo-btns">
            <button (click)="fillDemo('admin@lms.com','Admin@123')">{{ 'role.admin' | t }}</button>
            <button (click)="fillDemo('amr45409@gmail.com','Coord@123')">{{ 'role.coordinator' | t }}</button>
            <button (click)="fillDemo('ahmed.hassan@gmail.com','Student@123')">{{ 'role.student' | t }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
.login-page {
  min-height: 100vh;
  background-image: url('/assets/img2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}    .lang-switch { position: absolute; top: 20px; inset-inline-end: 20px; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.3); color: #fff; padding: 8px 16px; border-radius: 8px; font-size: .8rem; font-weight: 600; cursor: pointer; backdrop-filter: blur(4px); transition: background .15s; &:hover { background: rgba(255,255,255,.28); } }
    .login-card { background: var(--surface); border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,.25); }
    .login-logo {
  text-align: center;
  margin-bottom: 32px;

  .logo-img {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    display: block;
    margin: 0 auto 14px;
    object-fit: cover; // عشان الصورة تتملي كويس من غير ما تتشوه
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text);
  }

  p {
    color: var(--text-muted);
    font-size: .9rem;
    margin-top: 4px;
  }
}
    .pass-toggle { position:absolute; inset-inline-end:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; svg{width:18px;height:18px;} }
    .error-msg { background:var(--danger-light); color:var(--danger); padding:10px 14px; border-radius:8px; font-size:.875rem; margin-bottom:12px; }
    .w-full { width: 100%; justify-content: center; }
    .btn-spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .demo-accounts { margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;
      p { font-size:.8rem; color:var(--text-muted); margin-bottom:10px; text-align:center; }
      .demo-btns { display:flex; gap:8px; justify-content:center;
        button { padding:6px 14px; border:1.5px solid var(--border); border-radius:8px; background:var(--surface2); color:var(--text); font-size:.8rem; cursor:pointer; transition:all .15s; &:hover{border-color:var(--primary);color:var(--primary);} }
      }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  lang = inject(LanguageService);
  email = ''; password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  fillDemo(e: string, p: string) { this.email = e; this.password = p; }

  onLogin() {
    if (!this.email || !this.password) { this.error.set(this.lang.translate('login.fillFields')); return; }
    this.loading.set(true); this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: res => { this.auth.setSession(res); this.toast.success(this.lang.translate('login.welcomeBack', [res.user.name])); this.router.navigate(['/']); },
      error: () => { this.error.set(this.lang.translate('login.invalidCreds')); this.loading.set(false); }
    });
  }
}
