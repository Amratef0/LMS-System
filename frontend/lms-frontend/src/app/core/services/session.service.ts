import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private api = `${environment.apiUrl}/sessions`;
  constructor(private http: HttpClient) {}
  getSessions(filters: any = {}) {
    let p = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k]!=null && filters[k]!=='') p=p.set(k, filters[k]); });
    return this.http.get<any>(this.api, { params: p });
  }
  getSession(id: number) { return this.http.get<any>(`${this.api}/${id}`); }
  createSession(body: any) { return this.http.post(this.api, body); }
  updateSession(id: number, body: any) { return this.http.put(`${this.api}/${id}`, body); }
  runSession(id: number) { return this.http.post(`${this.api}/${id}/run`, {}); }
  finishSession(id: number) { return this.http.post(`${this.api}/${id}/finish`, {}); }
  cancelSession(id: number) { return this.http.post(`${this.api}/${id}/cancel`, {}); }
  getAttendance(id: number) { return this.http.get<any[]>(`${this.api}/${id}/attendance`); }
  saveAttendance(id: number, items: any[]) { return this.http.post(`${this.api}/${id}/attendance`, items); }
  addAttachment(id: number, body: any) { return this.http.post(`${this.api}/${id}/attachments`, body); }
  updateAttachment(id: number, attId: number, body: any) { return this.http.put(`${this.api}/${id}/attachments/${attId}`, body); }
  deleteAttachment(id: number, attId: number) { return this.http.delete(`${this.api}/${id}/attachments/${attId}`); }
  updateRecordLink(id: number, recordLink: string) { return this.http.put(`${this.api}/${id}/record-link`, { recordLink }); }
}
