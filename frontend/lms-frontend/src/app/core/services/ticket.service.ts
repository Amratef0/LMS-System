import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private api = `${environment.apiUrl}/tickets`;
  constructor(private http: HttpClient) {}
  getTickets(f:any={}) { let p=new HttpParams(); Object.keys(f).forEach(k=>{if(f[k]!=null&&f[k]!=='')p=p.set(k,f[k]);}); return this.http.get<any>(this.api,{params:p}); }
  getMyTickets() { return this.http.get<any[]>(`${this.api}/my`); }
  createTicket(title:string,description:string) { return this.http.post(this.api,{title,description}); }
  reply(id:number,message:string) { return this.http.post(`${this.api}/${id}/reply`,{message}); }
  updateStatus(id:number,status:string) { return this.http.put(`${this.api}/${id}/status`,{status}); }
}
