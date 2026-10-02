import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CairoDatePipe } from '../../../shared/pipes/cairo-date.pipe';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CairoDatePipe, TranslatePipe],
  template: `
    <!-- ===== STUDENT VIEW: Only submit ticket ===== -->
    <ng-container *ngIf="isStudent()">
      <div class="page-header"><h1>{{ 'tic.title' | t }}</h1><p>{{ 'tic.subtitleStudent' | t }}</p></div>

      <!-- Submit New Ticket -->
      <div class="card" style="max-width:600px;margin-bottom:24px">
        <div class="card-header"><strong>{{ 'tic.submitNew' | t }}</strong></div>
        <div class="card-body">
          <div class="form-group"><label>{{ 'tic.ticketTitle' | t }}</label><input class="form-control" [(ngModel)]="newTitle" [placeholder]="'tic.titlePlaceholder' | t"></div>
          <div class="form-group"><label>{{ 'tic.description' | t }}</label><textarea class="form-control" [(ngModel)]="newDesc" rows="4" [placeholder]="'tic.descPlaceholder' | t"></textarea></div>
          <div class="success-msg" *ngIf="submitSuccess()">{{ 'tic.submitSuccess' | t }}</div>
          <button class="btn btn-primary" (click)="submitTicket()" [disabled]="submitting()">
            {{ submitting() ? ('tic.submitting' | t) : ('tic.submitTicket' | t) }}
          </button>
        </div>
      </div>

      <!-- My Tickets -->
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">{{ 'tic.myTickets' | t }}</h3>
      <div class="tickets-grid">
        <div class="card ticket-card" *ngFor="let t of myTickets()">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <h4 style="font-size:.9rem;font-weight:600">{{ t.title }}</h4>
            <span class="badge" [ngClass]="statusCls(t.status)">{{ statusLbl(t.status) }}</span>
          </div>
          <p style="font-size:.8rem;color:var(--text-muted);margin:6px 0">{{ t.description }}</p>
          <p style="font-size:.75rem;color:var(--text-muted)">{{ t.createdAt | cairoDate:'full' }}</p>
        </div>
<div *ngIf="!myTickets().length" style="color:var(--text-muted);font-size:.875rem;grid-column:1/-1"></div>
</div>
    </ng-container>

    <!-- ===== ADMIN / COORDINATOR VIEW ===== -->
    <ng-container *ngIf="!isStudent()">
      <div class="page-header"><h1>{{ 'tic.title' | t }}</h1><p>{{ 'tic.subtitleAdmin' | t }}</p></div>

      <!-- Status Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
        <button [class]="'btn '+(activeStatus()===''?'btn-primary':'btn-ghost')" (click)="setStatus('')">All <span class="badge badge-ghost" style="margin-left:4px">{{ data()?.total||0 }}</span></button>
        <button [class]="'btn '+(activeStatus()==='in_progress'?'btn-primary':'btn-ghost')" (click)="setStatus('in_progress')">🕐 In Progress <span class="badge badge-ghost" style="margin-left:4px">{{ data()?.inProgress||0 }}</span></button>
        <button [class]="'btn '+(activeStatus()==='resolved'?'btn-primary':'btn-ghost')" (click)="setStatus('resolved')">✓ Resolved <span class="badge badge-ghost" style="margin-left:4px">{{ data()?.resolved||0 }}</span></button>
        <button [class]="'btn '+(activeStatus()==='closed'?'btn-primary':'btn-ghost')" (click)="setStatus('closed')">✕ Closed <span class="badge badge-ghost" style="margin-left:4px">{{ data()?.closed||0 }}</span></button>
        <button [class]="'btn '+(activeStatus()==='reopened'?'btn-primary':'btn-ghost')" (click)="setStatus('reopened')">↺ Reopened <span class="badge badge-ghost" style="margin-left:4px">{{ data()?.reopened||0 }}</span></button>
      </div>

      <div *ngIf="loading()" class="spinner"></div>

      <div class="tickets-grid" *ngIf="!loading()">
        <div class="card ticket-card" *ngFor="let t of tickets()">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
            <h4 style="font-size:.9rem;font-weight:600;line-height:1.4">{{ t.title }}</h4>
            <span class="badge" [ngClass]="statusCls(t.status)" style="flex-shrink:0">{{ statusLbl(t.status) }}</span>
          </div>
          <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">{{ t.description }}</p>
          <p style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px">Created: {{ t.createdAt | cairoDate:'full' }}</p>

          <details class="student-details">
            <summary>Student Details</summary>
            <div class="std-info"><p>Name: {{ t.student.name }}</p><p>Email: {{ t.student.email }}</p><p *ngIf="t.student.groupName">Group: {{ t.student.groupName }}</p></div>
          </details>

          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <select class="form-control" style="flex:1;min-width:130px;font-size:.8rem" (change)="changeStatus(t.id, $any($event.target).value)">
              <option value="">Change status...</option>
              <option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option><option value="reopened">Reopened</option>
            </select>
          </div>

          <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:10px" (click)="openReply(t)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Reply
          </button>
        </div>
        <div *ngIf="!tickets().length" style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No tickets found.</div>
      </div>

      <!-- Reply Modal -->
      <div class="modal-backdrop" *ngIf="showReply()" (click)="showReply.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>{{ 'tic.replyToTicket' | t }}</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showReply.set(false)">✕</button></div>
          <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:16px">{{ selectedTicket?.title }}</p>
          <div class="form-group"><label>{{ 'tic.message' | t }}</label><textarea class="form-control" [(ngModel)]="replyMsg" rows="4" [placeholder]="'tic.writeReply' | t"></textarea></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showReply.set(false)">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-primary" (click)="sendReply()">{{ 'tic.sendReply' | t }}</button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .tickets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
    .ticket-card{padding:20px;}
    .student-details{margin:8px 0;summary{font-size:.8rem;color:var(--text-muted);cursor:pointer;padding:7px 10px;background:var(--surface2);border-radius:6px;}}
    .std-info{padding:10px;font-size:.8rem;color:var(--text-muted);p{margin-bottom:4px;}}
    .success-msg{background:var(--success-light);color:var(--success);padding:10px 14px;border-radius:8px;font-size:.875rem;margin-bottom:12px;}
  `]
})
export class TicketsListComponent implements OnInit {
  private svc = inject(TicketService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  isStudent() { return this.auth.getRole()==='Student'; }

  // Admin/Coord
  data=signal<any>(null); tickets=signal<any[]>([]); loading=signal(true);
  activeStatus=signal('in_progress'); showReply=signal(false); selectedTicket:any=null; replyMsg='';

  // Student
  myTickets=signal<any[]>([]); newTitle=''; newDesc=''; submitting=signal(false); submitSuccess=signal(false);

  ngOnInit() {
    if (this.isStudent()) this.loadMyTickets();
    else this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getTickets({status:this.activeStatus()}).subscribe({next:r=>{this.data.set(r);this.tickets.set(r.items);this.loading.set(false);},error:()=>this.loading.set(false)});
  }
  setStatus(s:string) { this.activeStatus.set(s); this.load(); }

  loadMyTickets() {
    this.svc.getMyTickets().subscribe(t=>this.myTickets.set(t));
  }
  submitTicket() {
    if(!this.newTitle||!this.newDesc) return;
    this.submitting.set(true);
    this.svc.createTicket(this.newTitle,this.newDesc).subscribe({
      next: () => {
        this.submitting.set(false); this.submitSuccess.set(true); this.newTitle=''; this.newDesc='';
        this.loadMyTickets();
        setTimeout(()=>this.submitSuccess.set(false),3000);
      },
      error: e => { this.submitting.set(false); this.toast.error('Could not submit ticket', e.error?.message); }
    });
  }

  openReply(t:any) { this.selectedTicket=t; this.replyMsg=''; this.showReply.set(true); }
  sendReply() { this.svc.reply(this.selectedTicket.id,this.replyMsg).subscribe({ next: () => { this.showReply.set(false); this.toast.success('Reply sent'); }, error: e => this.toast.error('Could not send reply', e.error?.message) }); }
  changeStatus(id:number,status:string) { if(status) this.svc.updateStatus(id,status).subscribe({ next: () => { this.load(); this.toast.success('Ticket status updated', this.statusLbl(status)); }, error: e => this.toast.error('Could not update status', e.error?.message) }); }
  statusCls(s:string) { return {'badge-warning':s==='in_progress','badge-success':s==='resolved','badge-danger':s==='closed','badge-primary':s==='reopened'}; }
  statusLbl(s:string) { return ({in_progress:'In Progress',resolved:'Resolved',closed:'Closed',reopened:'Reopened'})[s]||s; }
}
