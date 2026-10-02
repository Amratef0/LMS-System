import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  private toast = inject(ToastService);
  currentUser = signal<User | null>(this.getStoredUser());
  private _loggedIn = signal<boolean>(!!localStorage.getItem('token'));

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password });
  }

  setSession(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this._loggedIn.set(true);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this._loggedIn.set(false);
    this.router.navigate(['/auth/login']);
    this.toast.info('Logged out', 'See you next time!');
  }

  getToken() { return localStorage.getItem('token'); }
  isLoggedIn() { return this._loggedIn(); }
  getRole() { return this.currentUser()?.role; }

  private getStoredUser(): User | null {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}
