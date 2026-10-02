import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div><h1>{{ 'stu.title' | t }}</h1><p>{{ 'stu.subtitle' | t }}</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="form-control" [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="'stu.searchPlaceholder' | t" style="width:220px">
        </div>
        <button class="filter-btn" (click)="showFilter.set(true)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filter
        </button>
        <button *ngIf="isAdmin()" class="btn btn-primary" (click)="showCreate.set(true)">{{ 'stu.addStudent' | t }}</button>
      </div>
    </div>

    <!-- Filter Modal -->
    <div class="modal-backdrop" *ngIf="showFilter()" (click)="showFilter.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3 style="color:var(--primary)">{{ 'common.filter' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showFilter.set(false)">✕</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group"><label>{{ 'stu.gender' | t }}</label>
            <select class="form-control" [(ngModel)]="filterGender">
              <option value="">{{ 'stu.selectGender2' | t }}</option><option value="Male">{{ 'stu.male' | t }}</option><option value="Female">{{ 'stu.female' | t }}</option>
            </select>
          </div>
          <div class="form-group"><label>{{ 'stu.group' | t }}</label>
            <select class="form-control" [(ngModel)]="filterGroupId">
              <option value="">{{ 'stu.allGroups' | t }}</option>
              <option *ngFor="let g of groups()" [value]="g.id">{{ g.name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="resetFilters()">{{ 'common.resetAll' | t }}</button>
          <button class="btn btn-primary" (click)="applyFilters()">{{ 'common.apply' | t }} ({{ activeFilterCount() }})</button>
        </div>
      </div>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <div class="card" *ngIf="!loading()">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>{{ 'stu.code' | t }}</th><th>{{ 'common.name' | t }}</th><th>{{ 'common.email' | t }}</th><th>{{ 'common.phone' | t }}</th><th>{{ 'stu.nationalId' | t }}</th><th>{{ 'stu.group' | t }}</th><th>{{ 'stu.city' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of students()">
              <td><span style="color:var(--primary);font-weight:600">{{ s.studentCode }}</span></td>
              <td>{{ s.name }}</td>
              <td style="font-size:.8rem">{{ s.email }}</td>
              <td>{{ s.phone||'-' }}</td>
              <td style="font-size:.8rem">{{ s.nationalId||'-' }}</td>
              <td><span class="badge badge-ghost" *ngIf="s.groupName">{{ s.groupName }}</span><span *ngIf="!s.groupName" style="color:var(--text-muted)">-</span></td>
              <td>{{ s.city||'Not Specified' }}</td>
              <td><span [class]="s.isActive?'badge badge-success':'badge badge-danger'">{{ s.isActive ? ('common.active' | t) : ('common.inactive' | t) }}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(s)">{{ 'stu.editDetails' | t }}</button>
                  <button class="btn btn-ghost btn-sm" (click)="openPassChange(s)" title="Change Password">🔑</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!students().length"><td colspan="9"><div class="empty-state"><p>{{ 'stu.noStudents' | t }}</p></div></td></tr>
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

    <!-- Create Student Modal -->
    <div class="modal-backdrop" *ngIf="showCreate()" (click)="showCreate.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'stu.addTitle' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showCreate.set(false)">✕</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group" style="grid-column:1/-1"><label>{{ 'stu.fullName' | t }} *</label><input class="form-control" [(ngModel)]="createForm.name" placeholder="Student full name"></div>
          <div class="form-group" style="grid-column:1/-1"><label>{{ 'common.email' | t }} *</label><input type="email" class="form-control" [(ngModel)]="createForm.email" placeholder="email@example.com"></div>
          <div class="form-group" style="grid-column:1/-1"><label>{{ 'stu.password' | t }} *</label><input type="password" class="form-control" [(ngModel)]="createForm.password" placeholder="Initial password"></div>
          <div class="form-group"><label>{{ 'common.phone' | t }}</label><input class="form-control" [(ngModel)]="createForm.phone" placeholder="01xxxxxxxxx"></div>
          <div class="form-group"><label>{{ 'stu.nationalId' | t }}</label><input class="form-control" [(ngModel)]="createForm.nationalId" [placeholder]="'stu.nationalId' | t"></div>
          <div class="form-group"><label>{{ 'stu.city' | t }}</label><input class="form-control" [(ngModel)]="createForm.city" placeholder="City"></div>
          <div class="form-group"><label>{{ 'stu.gender' | t }}</label>
            <select class="form-control" [(ngModel)]="createForm.gender"><option value="">{{ 'stu.selectGender' | t }}</option><option value="Male">{{ 'stu.male' | t }}</option><option value="Female">{{ 'stu.female' | t }}</option></select>
          </div>
          <div class="form-group" style="grid-column:1/-1"><label>{{ 'stu.group' | t }}</label>
            <select class="form-control" [(ngModel)]="createForm.groupId">
              <option value="">{{ 'stu.noGroup' | t }}</option>
              <option *ngFor="let g of groups()" [value]="g.id">{{ g.name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showCreate.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="createStudent()">{{ 'stu.addStudent' | t }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-backdrop" *ngIf="showEdit()" (click)="showEdit.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'stu.editTitle' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showEdit.set(false)">✕</button></div>
        <div class="form-group"><label>Name</label><input class="form-control" [(ngModel)]="editForm.name"></div>
        <div class="form-group"><label>{{ 'common.phone' | t }}</label><input class="form-control" [(ngModel)]="editForm.phone"></div>
        <div class="form-group"><label>{{ 'stu.city' | t }}</label><input class="form-control" [(ngModel)]="editForm.city"></div>
        <div class="form-group"><label>{{ 'stu.gender' | t }}</label>
          <select class="form-control" [(ngModel)]="editForm.gender"><option value="">{{ 'stu.selectGender' | t }}</option><option value="Male">{{ 'stu.male' | t }}</option><option value="Female">{{ 'stu.female' | t }}</option></select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showEdit.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveEdit()">{{ 'common.saveChanges' | t }}</button>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div class="modal-backdrop" *ngIf="showPass()" (click)="showPass.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'stu.changePassword' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showPass.set(false)">✕</button></div>
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">Student: <strong>{{ selectedStudent?.name }}</strong></p>
        <div class="form-group"><label>{{ 'stu.newPassword' | t }}</label><input type="password" class="form-control" [(ngModel)]="newPassword" placeholder="Enter new password"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showPass.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="savePassword()">{{ 'stu.updatePassword' | t }}</button>
        </div>
      </div>
    </div>
  `
})
export class StudentsListComponent implements OnInit {
  private svc = inject(StudentService);
  private groupSvc = inject(GroupService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  students=signal<any[]>([]); groups=signal<any[]>([]); loading=signal(true);
  total=signal(0); page=signal(1);
  search=''; showFilter=signal(false); filterGender=''; filterGroupId='';
  showCreate=signal(false); showEdit=signal(false); showPass=signal(false);
  createForm:any={name:'',email:'',password:'',phone:'',nationalId:'',city:'',gender:'',groupId:''};
  editForm:any={}; selectedStudent:any=null; newPassword='';

  isAdmin() { return this.auth.getRole()==='Admin'; }
  ngOnInit() { this.load(); this.loadGroups(); }
  loadGroups() { this.groupSvc.getGroups({pageSize:100}).subscribe(r=>this.groups.set(r.items)); }
  load() {
    this.loading.set(true);
    this.svc.getStudents({search:this.search,gender:this.filterGender,groupId:this.filterGroupId||undefined,page:this.page(),pageSize:10})
      .subscribe({next:r=>{this.students.set(r.items);this.total.set(r.total);this.loading.set(false);},error:()=>this.loading.set(false)});
  }
  onSearch() { this.page.set(1); this.load(); }
  applyFilters() { this.page.set(1); this.showFilter.set(false); this.load(); }
  resetFilters() { this.filterGender=''; this.filterGroupId=''; this.applyFilters(); }
  activeFilterCount() { return [this.filterGender,this.filterGroupId].filter(v=>v!=='').length; }
  openEdit(s:any) { this.selectedStudent=s; this.editForm={name:s.name,phone:s.phone||'',city:s.city||'',gender:s.gender||''}; this.showEdit.set(true); }
  saveEdit() { this.svc.updateStudent(this.selectedStudent.id,this.editForm).subscribe({ next: () => { this.showEdit.set(false); this.load(); this.toast.success('Student details updated'); }, error: e => this.toast.error('Could not update student', e.error?.message) }); }
  openPassChange(s:any) { this.selectedStudent=s; this.newPassword=''; this.showPass.set(true); }
  savePassword() { this.svc.resetPassword(this.selectedStudent.id,this.newPassword).subscribe({ next: () => { this.showPass.set(false); this.toast.success('Password updated'); }, error: e => this.toast.error('Could not update password', e.error?.message) }); }
  createStudent() {
    const payload={...this.createForm,groupId:this.createForm.groupId?+this.createForm.groupId:null};
    this.svc.createStudent(payload).subscribe({
      next: () => { this.showCreate.set(false); this.createForm={name:'',email:'',password:'',phone:'',nationalId:'',city:'',gender:'',groupId:''}; this.load(); this.toast.success('Student added'); },
      error: e => this.toast.error('Could not add student', e.error?.message)
    });
  }
  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages() { return Math.ceil(this.total()/10); }
  pages() { const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); }
  min(a:number,b:number){return Math.min(a,b);}
}
