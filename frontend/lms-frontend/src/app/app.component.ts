import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { AuthService } from './core/services/auth.service';
import { LanguageService } from './core/i18n/language.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, HeaderComponent, ToastContainerComponent],
  template: `
    <ng-container *ngIf="showLayout; else fullPage">
      <div class="app-layout">
        <app-sidebar />
        <div class="main-content">
          <app-header />
          <main class="page-content">
            <router-outlet />
          </main>
        </div>
      </div>
    </ng-container>
    <ng-template #fullPage>
      <router-outlet />
    </ng-template>
    <app-toast-container />
  `
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  // Inject LanguageService here so its constructor runs at startup — it reads localStorage
  // and sets the correct dir/lang attributes on <html> immediately, even on the login page.
  private langSvc = inject(LanguageService);
  private router = inject(Router);
  showLayout = false;

  ngOnInit() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    // langSvc constructor already handled dir + lang attributes via its effect()

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.showLayout = this.auth.isLoggedIn() && !this.router.url.includes('/auth/');
    });
    this.showLayout = this.auth.isLoggedIn() && !this.router.url.includes('/auth/');
  }
}
