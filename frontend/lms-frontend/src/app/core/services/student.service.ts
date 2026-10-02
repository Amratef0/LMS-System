import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private api = `${environment.apiUrl}/students`;
  constructor(private http: HttpClient) {}
  getStudents(f:any={}) { let p=new HttpParams(); Object.keys(f).forEach(k=>{if(f[k]!=null&&f[k]!=='')p=p.set(k,f[k]);}); return this.http.get<any>(this.api,{params:p}); }
  getStudent(id:number) { return this.http.get<any>(`${this.api}/${id}`); }
  createStudent(body:any) { return this.http.post(this.api,body); }
  updateStudent(id:number,body:any) { return this.http.put(`${this.api}/${id}`,body); }
  resetPassword(id:number,newPassword:string) { return this.http.post(`${this.api}/${id}/change-password`,{newPassword}); }
  getMe() { return this.http.get<any>(`${this.api}/me`); }
}
