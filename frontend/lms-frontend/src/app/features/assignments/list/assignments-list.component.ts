import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CairoDatePipe } from '../../../shared/pipes/cairo-date.pipe';
import { FormsModule } from '@angular/forms';
import { AssignmentService } from '../../../core/services/assignment.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-assignments-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CairoDatePipe, TranslatePipe],
  template: `
    <div class="page-header"><h1>{{ 'asgn.title' | t }}</h1><p>{{ 'asgn.subtitle' | t }}</p></div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
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
            <tr *ngFor="let a of assignments()">
              <td>
                <span style="color:var(--primary);font-weight:500">{{ a.title }}</span>
                <span class="badge badge-success" style="margin-left:6px;font-size:.7rem" *ngIf="a.isGraded">Graded</span>
                <span [class]="isPastDue(a.dueDate)?'badge badge-danger':'badge badge-warning'" style="margin-left:4px;font-size:.7rem" *ngIf="a.dueDate">{{ isPastDue(a.dueDate)?'Closed':'Open' }}</span>
              </td>
              <td>{{ a.createdAt | cairoDate:'short' }}</td>
              <td>
                <span *ngIf="a.dueDate">{{ a.dueDate | cairoDate:'full' }}</span>
                <span *ngIf="!a.dueDate" style="color:var(--text-muted)">—</span>
              </td>
              <td>{{ a.session?.name||'—' }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:5px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ a.submissionsCount }}
                </div>
              </td>
              <td><button class="btn btn-ghost btn-sm" style="border:1.5px solid var(--border)" (click)="viewSubs(a.id)">{{ 'qz.viewSubmissions' | t }}</button></td>
            </tr>
            <tr *ngIf="!assignments().length"><td colspan="6"><div class="empty-state"><p>{{ 'asgn.noAssignments' | t }}</p></div></td></tr>
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
      <div class="modal" style="max-width:720px" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'qz.viewSubmissions' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showSubs.set(false)">✕</button></div>
        <div *ngIf="loadingSubs()" class="spinner"></div>
        <div *ngIf="!loadingSubs() && subsData()">
          <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
            <span class="badge badge-success">{{ 'qz.submitted' | t }}: {{ subsData().submitted }}</span>
            <span class="badge badge-danger">{{ 'qz.notSubmitted' | t }}: {{ subsData().nonSubmitted }}</span>
            <span class="badge badge-ghost">{{ 'qz.expected' | t }}: {{ subsData().totalExpected }}</span>
          </div>
          <div class="table-wrapper" style="max-height:320px;overflow-y:auto">
            <table>
              <thead><tr><th>{{ 'stu.title' | t }}</th><th>{{ 'stu.code' | t }}</th><th>{{ 'common.submit' | t }}</th><th>{{ 'asgn.grade' | t }}</th><th>{{ 'qz.dueDate' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of subsData().items">
                  <td>{{ s.student.name }}</td>
                  <td><span class="badge badge-ghost">{{ s.student.studentCode }}</span></td>
                  <td><a *ngIf="s.fileUrl||s.link" [href]="s.fileUrl||s.link" target="_blank" class="btn btn-ghost btn-sm">{{ 'asgn.open' | t }}</a></td>
                  <td><span *ngIf="s.grade!=null" class="badge badge-success">{{ s.grade }}</span><span *ngIf="s.grade==null" style="color:var(--text-muted);font-size:.8rem">—</span></td>
                  <td>{{ s.submittedAt | cairoDate:'full' }}</td>
                  <td><button class="btn btn-ghost btn-sm" (click)="openGrade(s)">{{ 'asgn.grade' | t }}</button></td>
                </tr>
                <tr *ngIf="!subsData().items?.length"><td colspan="6" class="empty-state"><p>{{ 'asgn.noSubmissions' | t }}</p></td></tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="subsData().missed?.length" style="margin-top:14px">
            <p style="font-size:.875rem;font-weight:600;color:var(--danger);margin-bottom:8px">{{ 'asgn.missedStudents' | t }}</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              <span *ngFor="let m of subsData().missed" class="badge badge-danger">{{ m.name }} ({{ m.studentCode }})</span>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" (click)="showSubs.set(false)">{{ 'common.close' | t }}</button></div>
      </div>
    </div>

    <!-- Grade Modal -->
    <div class="modal-backdrop" *ngIf="showGrade()" (click)="showGrade.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'modal.grade' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showGrade.set(false)">✕</button></div>
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">{{ gradingSub?.student?.name }}</p>
        <div class="form-group"><label>{{ 'asgn.grade' | t }}</label><input type="number" class="form-control" [(ngModel)]="gradeForm.grade" min="0" max="100" placeholder="0-100"></div>
        <div class="form-group"><label>{{ 'sd.feedback' | t }}</label><textarea class="form-control" [(ngModel)]="gradeForm.feedback" rows="2"></textarea></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showGrade.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveGrade()">{{ 'common.save' | t }}</button>
        </div>
      </div>
    </div>
  `
})
export class AssignmentsListComponent implements OnInit {
  private svc = inject(AssignmentService);
  private toast = inject(ToastService);
  assignments=signal<any[]>([]); loading=signal(true);
  total=signal(0); page=signal(1); filterGraded='';
  showSubs=signal(false); loadingSubs=signal(false); subsData=signal<any>(null);
  showGrade=signal(false); gradingSub:any=null; currentAssignId:number|null=null;
  gradeForm:any={grade:'',feedback:''};
  ngOnInit(){this.load();}
  load(){
    this.loading.set(true);
    this.svc.getAssignments({isGraded:this.filterGraded,page:this.page(),pageSize:10})
      .subscribe({next:r=>{this.assignments.set(r.items);this.total.set(r.total);this.loading.set(false);},error:()=>this.loading.set(false)});
  }
  viewSubs(id:number){this.currentAssignId=id;this.loadingSubs.set(true);this.showSubs.set(true);this.svc.getSubmissions(id).subscribe(d=>{this.subsData.set(d);this.loadingSubs.set(false);});}
  openGrade(s:any){this.gradingSub=s;this.gradeForm={grade:s.grade||'',feedback:s.gradeFeedback||''};this.showGrade.set(true);}
  saveGrade(){this.svc.grade(this.currentAssignId!,this.gradingSub.id,+this.gradeForm.grade,this.gradeForm.feedback).subscribe({ next: () => { this.showGrade.set(false); this.viewSubs(this.currentAssignId!); this.toast.success('Grade saved', 'The student can now see their grade and feedback.'); }, error: e => this.toast.error('Could not save grade', e.error?.message) });}
  isPastDue(d:string){return d&&new Date(d)<new Date();}
  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages(){return Math.ceil(this.total()/10);}
  pages(){const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4);return Array.from({length:e-s+1},(_,i)=>s+i);}
  min(a:number,b:number){return Math.min(a,b);}
}
