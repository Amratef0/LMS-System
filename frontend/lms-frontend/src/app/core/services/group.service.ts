import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private api = `${environment.apiUrl}/groups`;
  constructor(private http: HttpClient) {}
  getGroups(f:any={}) {
    let p=new HttpParams();
    Object.keys(f).forEach(k=>{if(f[k]!=null&&f[k]!=='')p=p.set(k,f[k]);});
    return this.http.get<any>(this.api,{params:p});
  }
  getGroup(id:number) { return this.http.get<any>(`${this.api}/${id}`); }
  createGroup(body:any) { return this.http.post(this.api,body); }
  getTeams(groupId:number) { return this.http.get<any[]>(`${this.api}/${groupId}/teams`); }
  createTeam(groupId:number,body:any) { return this.http.post(`${this.api}/${groupId}/teams`,body); }
}
