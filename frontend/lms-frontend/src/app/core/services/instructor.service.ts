import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private api = `${environment.apiUrl}/instructors`;
  constructor(private http: HttpClient) {}

  getInstructors(f: any = {}) {
    let p = new HttpParams();
    Object.keys(f).forEach(k => { if (f[k] != null && f[k] !== '') p = p.set(k, f[k]); });
    return this.http.get<any>(this.api, { params: p });
  }
  getInstructor(id: number) { return this.http.get<any>(`${this.api}/${id}`); }
  createInstructor(body: any) { return this.http.post(this.api, body); }
  updateInstructor(id: number, body: any) { return this.http.put(`${this.api}/${id}`, body); }
  toggleStatus(id: number) { return this.http.post(`${this.api}/${id}/toggle-status`, {}); }
  deleteInstructor(id: number) { return this.http.delete(`${this.api}/${id}`); }
}
