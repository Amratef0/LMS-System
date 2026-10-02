import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private api = `${environment.apiUrl}/users/coordinators`;
  constructor(private http: HttpClient) {}

  getCoordinators(f: any = {}) {
    let p = new HttpParams();
    Object.keys(f).forEach(k => { if (f[k] != null && f[k] !== '') p = p.set(k, f[k]); });
    return this.http.get<any>(this.api, { params: p });
  }
  getCoordinator(id: number) { return this.http.get<any>(`${this.api}/${id}`); }
  createCoordinator(body: any) { return this.http.post(this.api, body); }
  updateCoordinator(id: number, body: any) { return this.http.put(`${this.api}/${id}`, body); }
  resetPassword(id: number, newPassword: string) { return this.http.post(`${this.api}/${id}/reset-password`, { newPassword }); }
  toggleStatus(id: number) { return this.http.put(`${environment.apiUrl}/users/${id}/toggle-status`, {}); }
  deleteCoordinator(id: number) { return this.http.delete(`${this.api}/${id}`); }
}
