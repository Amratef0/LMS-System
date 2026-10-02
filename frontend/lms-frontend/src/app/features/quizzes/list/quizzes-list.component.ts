import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CairoDatePipe } from '../../../shared/pipes/cairo-date.pipe';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quizzes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, CairoDatePipe, TranslatePipe],
  template: `
    <div class="page-header"><h1>{{ 'qz.title' | t }}</h1><p>{{ 'qz.subtitle' | t }}</p></div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <select class="form-control" style="width:180px" [(ngModel)]="filterType" (ngModelChange)="load()">
        <option value="">{{ 'common.filter' | t }} {{ 'common.type' | t }}</option><option value="multiple_choice">Multiple Choice</option><option value="true_false">True/False</option>
      </select>
      <select class="form-control" style="width:180px" [(ngModel)]="filterGraded" (ngModelChange)="load()">
        <option value="">{{ 'common.filter' | t }}</option><option value="true">Graded</option><option value="false">Not Graded</option>
      </select>
    </div>
    <div *ngIf="loading()" class="spinner"></div>
    <div class="card" *ngIf="!loading()">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>{{ 'common.name' | t }}</th><th>{{ 'qz.created' | t }}</th><th>{{ 'qz.dueDate' | t }}</th><th>{{ 'qz.session' | t }}</th><th>{{ 'qz.submissions' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let q of quizzes()">
              <td>
                <span style="color:var(--primary);font-weight:500">{{ q.title }}</span>
                <span class="badge badge-ghost" style="margin-left:6px;font-size:.7rem">{{ q.type | titlecase }}</span>
                <span class="badge badge-success" style="margin-left:4px;font-size:.7rem" *ngIf="q.isGraded">Graded</span>
              </td>
              <td>{{ q.createdAt | cairoDate:'short' }}</td>
              <td>
                <span *ngIf="q.dueDate">{{ q.dueDate | cairoDate:'full' }}</span>
                <span *ngIf="!q.dueDate" style="color:var(--text-muted)">—</span>
              </td>
              <td>{{ q.session?.name||'—' }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:5px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ q.submissionsCount }}
                </div>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" style="border:1.5px solid var(--border)" (click)="viewSubs(q.id)">{{ 'qz.viewSubmissions' | t }}</button>
              </td>
            </tr>
            <tr *ngIf="!quizzes().length"><td colspan="6"><div class="empty-state"><p>{{ 'qz.noQuizzes' | t }}</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">Showing {{ (page()-1)*10+1 }}-{{ min(page()*10, total()) }} of {{ total() }} items</span>
        <button (click)="goPage(page()-1)" [disabled]="page()===1">‹</button>
        <button *ngFor="let p of pages()" [class.active]="p===page()" (click)="goPage(p)">{{ p }}</button>
        <button (click)="goPage(page()+1)" [disabled]="page()>=totalPages()">›</button>
      </div>
    </div>

    <!-- Submissions Modal -->
    <div class="modal-backdrop" *ngIf="showSubs()" (click)="showSubs.set(false)">
      <div class="modal" style="max-width:640px" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'qz.viewSubmissions' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showSubs.set(false)">✕</button></div>
        <div *ngIf="loadingSubs()" class="spinner"></div>
        <div *ngIf="!loadingSubs() && subsData()">
          <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
            <span class="badge badge-success">{{ 'qz.submitted' | t }}: {{ subsData().submitted }}</span>
            <span class="badge badge-danger">{{ 'qz.notSubmitted' | t }}: {{ subsData().nonSubmitted }}</span>
            <span class="badge badge-ghost">{{ 'qz.expected' | t }}: {{ subsData().totalExpected }}</span>
          </div>
          <div class="table-wrapper" style="max-height:340px;overflow-y:auto">
            <table>
              <thead><tr><th>Student</th><th>Code</th><th>Score</th><th>Total</th><th>%</th><th>Submitted</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of subsData().submissions">
                  <td>{{ s.student.name }}</td>
                  <td><span class="badge badge-ghost">{{ s.student.studentCode }}</span></td>
                  <td><strong style="color:var(--success)">{{ s.score }}</strong></td>
                  <td>{{ s.totalPoints }}</td>
                  <td>{{ s.totalPoints > 0 ? (s.score/s.totalPoints*100 | number:'1.0-0') : 0 }}%</td>
                  <td>{{ s.submittedAt | cairoDate:'full' }}</td>
                </tr>
                <tr *ngIf="!subsData().submissions?.length"><td colspan="6" class="empty-state"><p>{{ 'qz.noSubmissions' | t }}</p></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" (click)="showSubs.set(false)">{{ 'common.close' | t }}</button></div>
      </div>
    </div>
  `
})
export class QuizzesListComponent implements OnInit {
  private svc = inject(QuizService);
  quizzes=signal<any[]>([]); loading=signal(true);
  total=signal(0); page=signal(1); filterType=''; filterGraded='';
  showSubs=signal(false); loadingSubs=signal(false); subsData=signal<any>(null);
  ngOnInit(){this.load();}
  load(){
    this.loading.set(true);
    this.svc.getQuizzes({type:this.filterType,isGraded:this.filterGraded,page:this.page(),pageSize:10})
      .subscribe({next:r=>{this.quizzes.set(r.items);this.total.set(r.total);this.loading.set(false);},error:()=>this.loading.set(false)});
  }
  viewSubs(id:number){this.loadingSubs.set(true);this.showSubs.set(true);this.svc.getSubmissions(id).subscribe(d=>{this.subsData.set(d);this.loadingSubs.set(false);});}
  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages(){return Math.ceil(this.total()/10);}
  pages(){const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4);return Array.from({length:e-s+1},(_,i)=>s+i);}
  min(a:number,b:number){return Math.min(a,b);}
}
