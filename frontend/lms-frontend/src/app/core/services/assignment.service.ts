import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private api = `${environment.apiUrl}/assignments`;
  constructor(private http: HttpClient) {}
  getAssignments(f:any={}) { let p=new HttpParams(); Object.keys(f).forEach(k=>{if(f[k]!=null&&f[k]!=='')p=p.set(k,f[k]);}); return this.http.get<any>(this.api,{params:p}); }
  getSubmissions(id:number,page=1) { return this.http.get<any>(`${this.api}/${id}/submissions?page=${page}`); }
  createAssignment(body:any) { return this.http.post(this.api,body); }
  updateAssignment(id:number,body:any) { return this.http.put(`${this.api}/${id}`,body); }
  submitAssignment(id:number,body:any) { return this.http.post(`${this.api}/${id}/submit`,body); }
  grade(assignId:number,subId:number,grade:number,feedback:string) { return this.http.post(`${this.api}/${assignId}/submissions/${subId}/grade`,{grade,feedback}); }
}
