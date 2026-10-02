import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private api = `${environment.apiUrl}/quizzes`;
  constructor(private http: HttpClient) {}
  getQuizzes(f:any={}) { let p=new HttpParams(); Object.keys(f).forEach(k=>{if(f[k]!=null&&f[k]!=='')p=p.set(k,f[k]);}); return this.http.get<any>(this.api,{params:p}); }
  getQuiz(id:number) { return this.http.get<any>(`${this.api}/${id}`); }
  createQuiz(body:any) { return this.http.post(this.api,body); }
  updateQuiz(id:number,body:any) { return this.http.put(`${this.api}/${id}`,body); }
  submitQuiz(id:number,answers:any[]) { return this.http.post(`${this.api}/${id}/submit`,{answers}); }
  getSubmissions(id:number) { return this.http.get<any>(`${this.api}/${id}/submissions`); }
}
