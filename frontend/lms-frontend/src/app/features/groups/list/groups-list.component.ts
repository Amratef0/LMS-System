import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div><h1>{{ 'grp.title' | t }}</h1><p>{{ 'grp.subtitle' | t }}</p></div>
      <button class="btn btn-primary" *ngIf="isAdmin()" (click)="openCreate()">{{ 'grp.createGroup' | t }}</button>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="form-control" [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="'grp.searchPlaceholder' | t" style="width:260px">
      </div>
    </div>

    <div class="tabs">
      <button [class.active]="tab()==='groups'" (click)="tab.set('groups')">{{ 'grp.groups' | t }}</button>
      <button [class.active]="tab()==='teams'" (click)="tab.set('teams')">{{ 'grp.teams' | t }}</button>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <!-- Groups Tab -->
    <div class="card" *ngIf="!loading() && tab()==='groups'">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>{{ 'common.name' | t }}</th><th>{{ 'grp.code' | t }}</th><th>{{ 'grp.startDate' | t }}</th><th>{{ 'grp.endDate' | t }}</th><th>{{ 'grp.coordinators' | t }}</th><th>{{ 'grp.students' | t }}</th><th>{{ 'common.status' | t }}</th><th *ngIf="isAdmin()">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let g of groups()">
              <td><span style="color:var(--primary);font-weight:500;cursor:pointer" (click)="selectGroup(g)">{{ g.name }}</span></td>
              <td><span class="badge badge-ghost">{{ g.code }}</span></td>
              <td>{{ g.startDate | date:'yyyy-MM-dd' }}</td>
              <td>{{ g.endDate | date:'yyyy-MM-dd' }}</td>
              <td>
                <div *ngFor="let c of g.coordinators" style="font-size:.8rem;color:var(--text-muted)">{{ c.email }}</div>
                <span *ngIf="!g.coordinators?.length" style="color:var(--text-muted);font-size:.8rem">—</span>
              </td>
              <td>{{ g.studentsCount }}</td>
              <td><span [class]="g.isActive?'badge badge-success':'badge badge-danger'">{{ g.isActive ? ('common.active' | t) : ('common.inactive' | t) }}</span></td>
              <td *ngIf="isAdmin()">
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(g)">{{ 'common.edit' | t }}</button>
                  <button class="btn btn-ghost btn-sm" (click)="openAssign(g)">{{ 'grp.assignCoord' | t }}</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!groups().length"><td [attr.colspan]="isAdmin()?8:7"><div class="empty-state"><p>{{ 'grp.noGroups' | t }}</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">Showing {{ (page()-1)*20+1 }}-{{ min(page()*20, total()) }} of {{ total() }} items</span>
        <button (click)="goPage(page()-1)" [disabled]="page()===1">‹</button>
        <button *ngFor="let p of pages()" [class.active]="p===page()" (click)="goPage(p)">{{ p }}</button>
        <button (click)="goPage(page()+1)" [disabled]="page()>=totalPages()">›</button>
      </div>
    </div>

    <!-- Teams Tab -->
    <div *ngIf="!loading() && tab()==='teams'">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <select class="form-control" style="width:220px" [(ngModel)]="selectedGroupId" (ngModelChange)="loadTeams()">
          <option value="">{{ 'grp.filterByGroup' | t }}</option>
          <option *ngFor="let g of groups()" [value]="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>{{ 'common.name' | t }}</th><th>{{ 'grp.startDate' | t }}</th><th>{{ 'grp.students' | t }}</th><th>{{ 'grp.teamLead' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of teams()">
                <td>{{ t.name }}</td>
                <td>{{ t.createdAt | date:'yyyy-MM-dd' }}</td>
                <td>{{ t.studentsCount }}</td>
                <td>{{ t.teamLead?.name||'-' }}</td>
              </tr>
              <tr *ngIf="!teams().length"><td colspan="4"><div class="empty-state"><p>{{ 'grp.noTeams' | t }}</p></div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination"><span class="page-info">Showing 0-0 of {{ teams().length }} items</span></div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div class="modal-backdrop" *ngIf="showCreate()" (click)="showCreate.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'grp.createTitle' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showCreate.set(false)">✕</button></div>
        <div class="form-group"><label>{{ 'grp.groupName' | t }} *</label><input class="form-control" [(ngModel)]="createForm.name" placeholder="e.g. CAI4_AIS3_S2"></div>
        <div class="form-group"><label>{{ 'grp.groupCode' | t }} *</label><input class="form-control" [(ngModel)]="createForm.code" placeholder="e.g. CAI4_AIS3_S2"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label>{{ 'grp.startDate' | t }}</label><input type="date" class="form-control" [(ngModel)]="createForm.startDate"></div>
          <div class="form-group"><label>{{ 'grp.endDate' | t }}</label><input type="date" class="form-control" [(ngModel)]="createForm.endDate"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showCreate.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveGroup()">Create Group</button>
        </div>
      </div>
    </div>

    <!-- Edit Group Modal -->
    <div class="modal-backdrop" *ngIf="showEdit()" (click)="showEdit.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'grp.editTitle' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showEdit.set(false)">✕</button></div>
        <div class="form-group"><label>Name</label><input class="form-control" [(ngModel)]="editForm.name"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label>{{ 'grp.startDate' | t }}</label><input type="date" class="form-control" [(ngModel)]="editForm.startDate"></div>
          <div class="form-group"><label>{{ 'grp.endDate' | t }}</label><input type="date" class="form-control" [(ngModel)]="editForm.endDate"></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:10px">
          <label class="toggle" style="margin:0"><input type="checkbox" [(ngModel)]="editForm.isActive"><span class="slider"></span></label>
          <span style="font-size:.875rem">{{ 'common.active' | t }}</span>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showEdit.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveEdit()">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Assign Coordinator Modal -->
    <div class="modal-backdrop" *ngIf="showAssign()" (click)="showAssign.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ 'grp.assignTitle' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAssign.set(false)">✕</button></div>
        <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">Group: <strong>{{ selectedGroup?.name }}</strong></p>

        <!-- Current coordinators -->
        <div *ngIf="selectedGroup?.coordinators?.length" style="margin-bottom:14px">
          <p style="font-size:.8rem;font-weight:600;margin-bottom:8px">{{ 'grp.currentCoords' | t }}</p>
          <div *ngFor="let c of selectedGroup?.coordinators" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface2);border-radius:8px;margin-bottom:6px;font-size:.875rem">
            <span>{{ c.name }} <span style="color:var(--text-muted)">({{ c.email }})</span></span>
            <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" (click)="removeCoord(c.coordinatorId)">{{ 'grp.remove' | t }}</button>
          </div>
        </div>

        <div class="form-group"><label>{{ 'grp.assignNew' | t }}</label>
          <select class="form-control" [(ngModel)]="assignCoordId">
            <option value="">{{ 'grp.select' | t }}</option>
            <option *ngFor="let c of coordinators()" [value]="c.id">{{ c.name }} ({{ c.email }})</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showAssign.set(false)">{{ 'common.cancel' | t }}</button>
          <button class="btn btn-primary" (click)="saveAssign()" [disabled]="!assignCoordId">{{ 'grp.assign' | t }}</button>
        </div>
      </div>
    </div>
  `
})
export class GroupsListComponent implements OnInit {
  private svc = inject(GroupService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  groups=signal<any[]>([]); teams=signal<any[]>([]); coordinators=signal<any[]>([]);
  loading=signal(true); total=signal(0); page=signal(1);
  tab=signal<'groups'|'teams'>('groups'); search=''; selectedGroupId=''; selectedGroup:any=null;
  showCreate=signal(false); showEdit=signal(false); showAssign=signal(false);
  createForm:any={name:'',code:'',startDate:'',endDate:''};
  editForm:any={}; assignCoordId='';

  isAdmin() { return this.auth.getRole()==='Admin'; }
  ngOnInit() { this.load(); this.loadCoordinators(); }
  loadCoordinators() { this.http.get<any>(`${environment.apiUrl}/users/coordinators?pageSize=100`).subscribe(r=>this.coordinators.set(r.items)); }
  load() {
    this.loading.set(true);
    this.svc.getGroups({search:this.search,page:this.page(),pageSize:20}).subscribe({next:r=>{this.groups.set(r.items);this.total.set(r.total);this.loading.set(false);},error:()=>this.loading.set(false)});
  }
  onSearch() { this.page.set(1); this.load(); }
  selectGroup(g:any) { this.selectedGroupId=g.id; this.tab.set('teams'); this.loadTeams(); }
  loadTeams() { if(this.selectedGroupId) this.svc.getTeams(+this.selectedGroupId).subscribe(t=>this.teams.set(t)); else this.teams.set([]); }
  openCreate() { this.createForm={name:'',code:'',startDate:'',endDate:''}; this.showCreate.set(true); }
  saveGroup() { this.svc.createGroup(this.createForm).subscribe({ next: () => { this.showCreate.set(false); this.load(); this.toast.success('Group created'); }, error: e => this.toast.error('Could not create group', e.error?.message) }); }
  openEdit(g:any) {
    this.selectedGroup=g;
    this.editForm={name:g.name,startDate:g.startDate?.substring(0,10),endDate:g.endDate?.substring(0,10),isActive:g.isActive};
    this.showEdit.set(true);
  }
  saveEdit() { this.http.put(`${environment.apiUrl}/groups/${this.selectedGroup.id}`,this.editForm).subscribe({ next: () => { this.showEdit.set(false); this.load(); this.toast.success('Group updated'); }, error: (e:any) => this.toast.error('Could not update group', e.error?.message) }); }
  openAssign(g:any) {
    this.svc.getGroup(g.id).subscribe(detail=>{ this.selectedGroup=detail; this.assignCoordId=''; this.showAssign.set(true); });
  }
  saveAssign() {
    this.http.post(`${environment.apiUrl}/groups/${this.selectedGroup.id}/assign-coordinator`,{coordinatorId:+this.assignCoordId,replace:false})
      .subscribe({ next: () => { this.assignCoordId=''; this.openAssign({id:this.selectedGroup.id}); this.load(); this.toast.success('Coordinator assigned'); }, error: (e:any) => this.toast.error('Could not assign coordinator', e.error?.message) });
  }
  removeCoord(coordId:number) {
    this.http.delete(`${environment.apiUrl}/groups/${this.selectedGroup.id}/coordinators/${coordId}`)
      .subscribe({ next: () => { this.openAssign({id:this.selectedGroup.id}); this.load(); this.toast.success('Coordinator removed'); }, error: (e:any) => this.toast.error('Could not remove coordinator', e.error?.message) });
  }
  goPage(p: number) { this.page.set(p); this.load(); }
  totalPages(){return Math.ceil(this.total()/20);}
  pages(){const t=this.totalPages(),c=this.page(),s=Math.max(1,c-2),e=Math.min(t,s+4);return Array.from({length:e-s+1},(_,i)=>s+i);}
  min(a:number,b:number){return Math.min(a,b);}
}
