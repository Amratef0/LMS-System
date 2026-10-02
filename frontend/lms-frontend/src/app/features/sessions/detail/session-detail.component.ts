import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuizService } from '../../../core/services/quiz.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { CairoDatePipe } from '../../../shared/pipes/cairo-date.pipe';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CairoDatePipe, TranslatePipe],
  template: `
    <div *ngIf="loading()" class="spinner"></div>
    <ng-container *ngIf="session()">
      <div class="page-header" style="text-align:center;margin-bottom:24px">
        <h1>{{ session().name }}</h1>
        <p>{{ 'sd.subtitle' | t }}</p>
      </div>

      <div class="detail-grid">
        <!-- LEFT -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <strong>{{ 'sd.sessionInfo' | t }}</strong>
              </div>
              <span [class]="statusBadge(session().status)">{{ session().status | titlecase }}</span>
            </div>
            <div class="card-body">
              <div class="info-row"><span class="i-icon">📅</span><span class="i-label">Date:</span><span>{{ session().sessionDate | cairoDate:'short' }}</span></div>
              <div class="info-row"><span class="i-icon">🕐</span><span class="i-label">Time:</span><span>{{ session().sessionDate | cairoDate:'time' }}</span></div>
              <div class="info-row"><span class="i-icon">👤</span><span class="i-label">{{ 'sd.trainer' | t }}</span><span>{{ session().trainer.name }}</span></div>
              <div class="info-row">
                <span class="i-icon">▶</span><span class="i-label">{{ 'sd.type' | t }}</span>
                <span class="badge" [class]="session().type==='live'?'badge-primary':'badge-warning'">{{ session().type === 'live' ? ('sf.liveSession' | t) : ('sf.physicalSession' | t) }}</span>
              </div>
              <div class="info-row"><span class="i-icon">🔖</span><span class="i-label">{{ 'sd.focus' | t }}</span><span class="badge badge-info">{{ session().topic === 'technical' ? ('sf.technical' | t) : ('sf.softSkill' | t) }} Session</span></div>
              <div class="info-row"><span class="i-icon">👥</span><span class="i-label">{{ 'sd.group' | t }}</span><span>{{ session().group.code }}</span></div>

              <!-- Student: own attendance -->
              <div class="info-row" *ngIf="isStudent()">
                <span class="i-icon">🎓</span><span class="i-label">{{ 'sd.yourStatus' | t }}</span>
                <span *ngIf="session().attendanceStatus==='taken'">
                  <span [class]="session().myAttendance?.joined ? 'badge badge-success' : 'badge badge-danger'">
  {{ session().myAttendance?.joined ? ('sd.attended' | t) : ('sd.absent' | t) }}
</span>
                </span>
                <span *ngIf="session().attendanceStatus!=='taken'" class="badge badge-ghost">{{ 'sd.notRecorded' | t }}</span>
              </div>

              <!-- Manager: attendance status -->
              <div class="info-row" *ngIf="canManage()">
                <span class="i-icon">✅</span><span class="i-label">{{ 'sd.attendance' | t }}</span>
                <span [class]="session().attendanceStatus==='taken'?'badge badge-success':'badge badge-danger'">
                  {{ session().attendanceStatus === 'taken' ? ('sd.taken' | t) : ('sd.notTaken' | t) }}
                </span>
              </div>

              <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">

              <!-- ── QUIZZES section (visible to ALL roles) ── -->
              <div class="section-sub">
                <span>{{ 'sd.quizzes' | t }}</span>
                <button class="btn btn-ghost btn-sm" *ngIf="canManage() && (session().status==='running'||session().status==='finished')" (click)="showAddQuiz.set(true)">+ Add Quiz</button>
              </div>

              <div *ngIf="!session().quizzes.length" style="color:var(--text-muted);font-size:.875rem;margin-bottom:12px">{{ 'sd.noQuizzes' | t }}</div>

              <div *ngFor="let q of session().quizzes" class="eval-item">
                <div>
                  <div style="font-size:.875rem;font-weight:500;color:var(--primary)">{{ q.title }}</div>
                  <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">
                    <span class="badge badge-ghost" style="font-size:.7rem">{{ q.type | titlecase }}</span>
                    <span *ngIf="q.dueDate" style="margin-left:6px">Due: {{ q.dueDate | cairoDate:'full' }}</span>
                    <span *ngIf="isPastDue(q.dueDate)" class="badge badge-danger" style="margin-left:6px;font-size:.7rem">Closed</span>
                    <span *ngIf="q.dueDate && !isPastDue(q.dueDate)" class="badge badge-success" style="margin-left:6px;font-size:.7rem">Open</span>
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                  <!-- Student: take quiz if open and not submitted -->
                  <a *ngIf="isStudent() && !isPastDue(q.dueDate) && !myQuizSubmission(q.id)" [routerLink]="['/sessions', session().id, 'quiz', q.id]" class="btn btn-primary btn-sm">{{ 'sd.takeQuiz' | t }}</a>
                  <span *ngIf="isStudent() && myQuizSubmission(q.id)" class="badge badge-success">
                    Score: {{ myQuizSubmission(q.id)?.score }}/{{ myQuizSubmission(q.id)?.totalPoints }}
                  </span>
                  <span *ngIf="isStudent() && isPastDue(q.dueDate) && !myQuizSubmission(q.id)" class="badge badge-danger">{{ 'sd.missed' | t }}</span>
                  <!-- Manager: view submissions -->
                  <button *ngIf="canManage()" class="btn btn-ghost btn-sm" (click)="viewQuizSubmissions(q.id)">Submissions ({{ q.submissionsCount }})</button>
                </div>
              </div>

              <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">

              <!-- ── ASSIGNMENTS section (visible to ALL roles) ── -->
              <div class="section-sub">
                <span>{{ 'sd.assignments' | t }}</span>
                <button class="btn btn-ghost btn-sm" *ngIf="canManage()" (click)="openAssignModal()">
                  {{ session().assignments.length>0?'✏ Edit Assignment':'+ Add Assignment' }}
                </button>
              </div>

              <div *ngIf="!session().assignments.length" style="color:var(--text-muted);font-size:.875rem;margin-bottom:12px">{{ 'sd.noAssignments' | t }}</div>

              <div *ngFor="let a of session().assignments" class="eval-item-wrap">
                <div class="eval-item">
                  <div>
                    <div style="font-size:.875rem;font-weight:500;color:var(--primary)">{{ a.title }}</div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px" *ngIf="a.description">{{ a.description }}</div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">
                      <span *ngIf="a.dueDate">Due: {{ a.dueDate | cairoDate:'full' }}</span>
                      <span *ngIf="isPastDue(a.dueDate)" class="badge badge-danger" style="margin-left:6px;font-size:.7rem">Closed</span>
                      <span *ngIf="a.dueDate && !isPastDue(a.dueDate)" class="badge badge-success" style="margin-left:6px;font-size:.7rem">Open</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;flex-shrink:0;align-items:center">
                    <!-- Student: submit if open and not submitted -->
                    <button *ngIf="isStudent() && !isPastDue(a.dueDate) && !myAssignSubmission(a.id)" class="btn btn-primary btn-sm" (click)="openSubmitAssign(a)">{{ 'sd.submit' | t }}</button>
                    <ng-container *ngIf="isStudent() && myAssignSubmission(a.id)">
                      <span *ngIf="a.mySubmission?.grade != null" class="badge badge-success">Grade: {{ a.mySubmission.grade }}</span>
                      <span *ngIf="a.mySubmission?.grade == null" class="badge badge-ghost">{{ 'sd.notGradedYet' | t }}</span>
                    </ng-container>
                    <span *ngIf="isStudent() && isPastDue(a.dueDate) && !myAssignSubmission(a.id)" class="badge badge-danger">{{ 'sd.missed' | t }}</span>
                    <!-- Manager: view submissions -->
                    <button *ngIf="canManage()" class="btn btn-ghost btn-sm" (click)="viewAssignmentSubmissions(a.id)">Submissions ({{ a.submissionsCount }})</button>
                  </div>
                </div>
                <div *ngIf="isStudent() && myAssignSubmission(a.id) && a.mySubmission?.gradeFeedback" class="grade-feedback">
                  <strong>{{ 'sd.feedback' | t }}</strong> {{ a.mySubmission.gradeFeedback }}
                </div>
              </div>


              <!-- Manager only extras -->
              <ng-container *ngIf="canManage()">
                <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button class="btn btn-ghost btn-sm" *ngIf="session().status==='finished'" (click)="showRecordModal.set(true)">{{ 'sd.editRecordLink' | t }}</button>
                </div>
                <div class="section-sub" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
                  <span>{{ 'sd.sessionAttendance' | t }}</span>
                  <button class="btn btn-ghost btn-sm" (click)="openAttendance()">{{ 'sd.viewEdit' | t }}</button>
                </div>
                <div class="att-summary">
                  <div>Total: <strong>{{ session().attendance.total }}</strong></div>
                  <div>Joined: <strong>{{ session().attendance.joined }}</strong></div>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- Attachments -->
          <div class="card">
            <div class="card-header">
              <strong>{{ 'sd.sessionAttachments' | t }}</strong>
              <button class="btn btn-ghost btn-sm" *ngIf="canManage()" (click)="openAddAttach()">+ Add</button>
            </div>
            <div class="card-body">
              <div *ngIf="!session().attachments.length" style="color:var(--text-muted);font-size:.875rem">{{ 'sd.noAttachments' | t }}</div>
              <div class="attach-row" *ngFor="let a of session().attachments">
                <span style="font-size:.875rem">📄 {{ a.title }}</span>
                <div style="display:flex;gap:6px">
                  <a *ngIf="a.fileUrl||a.link" [href]="a.fileUrl||a.link" target="_blank" class="btn btn-ghost btn-sm">{{ 'sd.open2' | t }}</a>
                  <button *ngIf="canManage()" class="btn btn-sm" style="background:var(--primary-light);color:var(--primary);border:none" (click)="editAttach(a)">✏</button>
                  <button *ngIf="canManage()" class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" (click)="deleteAttach(a.id)">🗑</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div>
          <!-- Session Actions -->
          <div class="card" style="margin-bottom:16px" *ngIf="canManage() && session().status!=='finished' && session().status!=='cancelled'">
            <div class="card-header"><strong>{{ 'sd.sessionActions' | t }}</strong></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-primary" style="justify-content:center" *ngIf="session().status==='pending'" (click)="runSession()">{{ 'sd.runSession' | t }}</button>
              <button class="btn btn-success" style="justify-content:center" *ngIf="session().status==='running'" (click)="finishSession()">{{ 'sd.completeSession' | t }}</button>
              <button class="btn btn-ghost" style="justify-content:center;color:var(--danger);border-color:var(--danger-light)" (click)="cancelSession()">{{ 'sd.cancelSession' | t }}</button>
            </div>
          </div>

          <!-- Record link -->
          <div class="card" style="margin-bottom:16px" *ngIf="session().recordLink">
            <div class="card-body">
              <a [href]="session().recordLink" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View Session Recording
              </a>
            </div>
          </div>

          <!-- Location (physical sessions) -->
          <div class="card" style="margin-bottom:16px" *ngIf="session().location">
            <div class="card-body" style="display:flex;align-items:center;gap:12px">
              <span style="font-size:1.4rem">📍</span>
              <div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:2px">{{ 'sf.location' | t }}</div>
                <div style="font-weight:600;color:var(--text)">{{ session().location }}</div>
              </div>
            </div>
          </div>

          <!-- Time Tracking -->
          <div class="card">
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <strong>{{ 'sd.timeTracking' | t }}</strong>
              </div>
            </div>
            <div class="card-body" *ngIf="session().timeTracking.startedAt; else noTrack">
              <h4 style="font-size:.875rem;font-weight:700;margin-bottom:10px">{{ 'sd.adminTimeTracking' | t }}</h4>
              <div class="track-row"><span>👤</span> {{ 'sd.startedBy' | t }} <strong>{{ session().timeTracking.startedBy?.name }}</strong></div>
              <div class="track-row"><span>📅</span> {{ 'sd.startedAt' | t }} <strong>{{ session().timeTracking.startedAt | cairoDate:'full' }}</strong></div>
              <ng-container *ngIf="session().timeTracking.endedAt">
                <div class="track-row"><span>👤</span> {{ 'sd.endedBy' | t }} <strong>{{ session().timeTracking.endedBy?.name }}</strong></div>
                <div class="track-row"><span>📅</span> {{ 'sd.endedAt' | t }} <strong>{{ session().timeTracking.endedAt | cairoDate:'full' }}</strong></div>
              </ng-container>
              <ng-container *ngIf="session().timeTracking.attendanceTakenAt">
                <div class="track-row"><span>👤</span> {{ 'sd.attendanceBy' | t }} <strong>{{ session().timeTracking.attendanceTakenBy?.name }}</strong></div>
                <div class="track-row"><span>📅</span> {{ 'sd.attendanceAt' | t }} <strong>{{ session().timeTracking.attendanceTakenAt | cairoDate:'full' }}</strong></div>
              </ng-container>
            </div>
            <ng-template #noTrack>
              <div class="card-body" style="color:var(--text-muted);font-size:.875rem;text-align:center;padding:20px">{{ 'sd.noTimeTracking' | t }}</div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- ══════════ MODALS ══════════ -->

      <!-- Attendance Modal -->
      <div class="modal-backdrop" *ngIf="showAttendance()" (click)="showAttendance.set(false)">
        <div class="modal" style="max-width:520px" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Attendance Details</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAttendance.set(false)">✕</button></div>
          <div style="display:grid;grid-template-columns:1fr auto;font-size:.8rem;font-weight:600;color:var(--text-muted);padding:8px 0;border-bottom:1px solid var(--border)"><span>Student</span><span>Status</span></div>
          <div style="max-height:360px;overflow-y:auto">
            <div *ngFor="let a of attendance()" style="display:grid;grid-template-columns:1fr auto;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:.875rem">{{ a.studentName }} <small style="color:var(--text-muted)">({{ a.studentCode }})</small></span>
              <div style="display:flex;align-items:center;gap:8px">
                <label class="toggle"><input type="checkbox" [(ngModel)]="a.joined"><span class="slider"></span></label>
                <span style="font-size:.78rem;color:var(--text-muted);min-width:64px">{{ a.joined?'Joined':'Not-Joined' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showAttendance.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveAttendance()">{{ 'common.save' | t }} {{ 'sd.attendance' | t }}</button>
          </div>
        </div>
      </div>

      <!-- Attachment Modal -->
      <div class="modal-backdrop" *ngIf="showAttachModal()" (click)="showAttachModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>{{ editingAttach?'Edit':'Add' }} Attachment</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAttachModal.set(false)">✕</button></div>
          <div class="form-group"><label>Title</label><input class="form-control" [(ngModel)]="attachForm.title" placeholder="Attachment title"></div>
          <div class="form-group"><label>Type</label>
            <select class="form-control" [(ngModel)]="attachForm.attachmentType">
              <option value="link">External Link</option>
              <option value="pdf">Upload PDF File</option>
            </select>
          </div>
          <div class="form-group" *ngIf="attachForm.attachmentType==='link'"><label>Link URL</label><input class="form-control" [(ngModel)]="attachForm.link" placeholder="https://..."></div>
          <div class="form-group" *ngIf="attachForm.attachmentType==='pdf'">
            <label>PDF File</label>
            <input type="file" accept="application/pdf" class="form-control" (change)="onAttachPdfSelected($event)">
            <div *ngIf="attachUploadProgress() !== null" class="upload-progress-wrap">
              <div class="upload-progress-bar" [style.width]="attachUploadProgress() + '%'"></div>
            </div>
            <div *ngIf="attachForm.fileUrl" class="upload-success">✓ Uploaded{{ attachForm.uploadedName ? ': ' + attachForm.uploadedName : '' }}</div>
            <div *ngIf="attachUploadError()" class="upload-error">{{ attachUploadError() }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showAttachModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveAttach()" [disabled]="attachIsUploading() || !attachForm.title || (attachForm.attachmentType==='link' && !attachForm.link) || (attachForm.attachmentType==='pdf' && !attachForm.fileUrl)">Save</button>
          </div>
        </div>
      </div>

      <!-- Record Link Modal -->
      <div class="modal-backdrop" *ngIf="showRecordModal()" (click)="showRecordModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Edit Record Link</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showRecordModal.set(false)">✕</button></div>
          <div class="form-group"><label>Record Link</label><input class="form-control" [(ngModel)]="recordLink" placeholder="https://zoom.us/rec/..."></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showRecordModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveRecordLink()">Save</button>
          </div>
        </div>
      </div>

      <!-- Add Quiz Modal -->
      <div class="modal-backdrop" *ngIf="showAddQuiz()" (click)="showAddQuiz.set(false)">
        <div class="modal" style="max-width:680px;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Add Quiz</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAddQuiz.set(false)">✕</button></div>
          <div class="form-group"><label>Quiz Title</label><input class="form-control" [(ngModel)]="quizForm.title" placeholder="e.g. Week 1 Quiz"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label>Type</label>
              <select class="form-control" [(ngModel)]="quizForm.type">
                <option value="multiple_choice">Multiple Choice (4 options)</option>
                <option value="true_false">True / False</option>
              </select>
            </div>
            <div class="form-group"><label>Due Date & Time (Cairo time)</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="quizForm.dueDate">
            </div>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px">
            <label class="toggle" style="margin:0"><input type="checkbox" [(ngModel)]="quizForm.isGraded"><span class="slider"></span></label>
            <span style="font-size:.875rem">Graded Quiz (auto-score after submission)</span>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <strong style="font-size:.95rem">Questions ({{ quizForm.questions.length }})</strong>
            <button class="btn btn-primary btn-sm" (click)="addQuestion()">+ Add Question</button>
          </div>
          <div *ngFor="let q of quizForm.questions; let i=index" class="q-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-size:.85rem;font-weight:600;color:var(--text-muted)">Q{{ i+1 }}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:.8rem;color:var(--text-muted)">Points:</span>
                <input type="number" class="form-control" [(ngModel)]="q.points" style="width:65px;padding:4px 8px" min="1" max="100">
                <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none;padding:4px 8px" (click)="removeQuestion(i)">🗑</button>
              </div>
            </div>
            <div class="form-group"><input class="form-control" [(ngModel)]="q.questionText" placeholder="Type your question here..."></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <label class="option-label" [class.correct]="q.correctAnswer==='A'">
                <input type="radio" [name]="'q'+i" value="A" [(ngModel)]="q.correctAnswer">
                <input class="form-control" [(ngModel)]="q.optionA" placeholder="Option A">
              </label>
              <label class="option-label" [class.correct]="q.correctAnswer==='B'">
                <input type="radio" [name]="'q'+i" value="B" [(ngModel)]="q.correctAnswer">
                <input class="form-control" [(ngModel)]="q.optionB" placeholder="Option B">
              </label>
              <label *ngIf="quizForm.type==='multiple_choice'" class="option-label" [class.correct]="q.correctAnswer==='C'">
                <input type="radio" [name]="'q'+i" value="C" [(ngModel)]="q.correctAnswer">
                <input class="form-control" [(ngModel)]="q.optionC" placeholder="Option C">
              </label>
              <label *ngIf="quizForm.type==='multiple_choice'" class="option-label" [class.correct]="q.correctAnswer==='D'">
                <input type="radio" [name]="'q'+i" value="D" [(ngModel)]="q.correctAnswer">
                <input class="form-control" [(ngModel)]="q.optionD" placeholder="Option D">
              </label>
            </div>
            <div *ngIf="q.correctAnswer" style="font-size:.75rem;color:var(--success);margin-top:6px">✓ Correct answer: Option {{ q.correctAnswer }}</div>
          </div>
          <div *ngIf="!quizForm.questions.length" style="text-align:center;color:var(--text-muted);padding:20px;font-size:.875rem">Click "+ Add Question" to start building your quiz</div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showAddQuiz.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveQuiz()" [disabled]="!quizForm.title || !quizForm.questions.length">Save Quiz</button>
          </div>
        </div>
      </div>

      <!-- Assignment Modal (Manager) -->
      <div class="modal-backdrop" *ngIf="showAssignModal()" (click)="showAssignModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>{{ editingAssign?'Edit':'Add' }} Assignment</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAssignModal.set(false)">✕</button></div>
          <div class="form-group"><label>Title</label><input class="form-control" [(ngModel)]="assignForm.title" placeholder="Assignment title"></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" [(ngModel)]="assignForm.description" rows="3" placeholder="Instructions for students..."></textarea></div>
          <div class="form-group"><label>Due Date & Time (Cairo time)</label><input type="datetime-local" class="form-control" [(ngModel)]="assignForm.dueDate"></div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px">
            <label class="toggle" style="margin:0"><input type="checkbox" [(ngModel)]="assignForm.isGraded"><span class="slider"></span></label>
            <span style="font-size:.875rem">Graded Assignment</span>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showAssignModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveAssignment()">{{ editingAssign?'Update':'Create' }}</button>
          </div>
        </div>
      </div>

      <!-- Submit Assignment Modal (Student) -->
      <div class="modal-backdrop" *ngIf="showSubmitAssign()" (click)="showSubmitAssign.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Submit Assignment</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showSubmitAssign.set(false)">✕</button></div>
          <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:16px"><strong>{{ submittingAssign?.title }}</strong></p>
          <div class="form-group"><label>Submission Type</label>
            <select class="form-control" [(ngModel)]="submitForm.submissionType">
              <option value="file">Upload PDF File</option>
              <option value="link">External Link</option>
            </select>
          </div>
          <div class="form-group" *ngIf="submitForm.submissionType==='file'">
            <label>PDF File</label>
            <input #pdfInput type="file" accept="application/pdf" class="form-control" (change)="onPdfSelected($event)">
            <div *ngIf="uploadProgress() !== null" class="upload-progress-wrap">
              <div class="upload-progress-bar" [style.width]="uploadProgress() + '%'"></div>
            </div>
            <div *ngIf="submitForm.fileUrl" class="upload-success">✓ Uploaded: {{ submitForm.uploadedName }}</div>
            <div *ngIf="uploadError()" class="upload-error">{{ uploadError() }}</div>
          </div>
          <div class="form-group" *ngIf="submitForm.submissionType==='link'">
            <label>Link</label>
            <input class="form-control" [(ngModel)]="submitForm.link" placeholder="https://...">
          </div>
          <div class="form-group"><label>Notes (optional)</label><textarea class="form-control" [(ngModel)]="submitForm.notes" rows="2" placeholder="Any notes..."></textarea></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showSubmitAssign.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="doSubmitAssign()" [disabled]="isUploading() || (submitForm.submissionType==='file' && !submitForm.fileUrl) || (submitForm.submissionType==='link' && !submitForm.link)">{{ 'sd.submit' | t }}</button>
          </div>
        </div>
      </div>

      <!-- Quiz Submissions Modal (Manager) -->
      <div class="modal-backdrop" *ngIf="showQuizSubs()" (click)="showQuizSubs.set(false)">
        <div class="modal" style="max-width:680px" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Quiz Submissions</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showQuizSubs.set(false)">✕</button></div>
          <div *ngIf="loadingSubs()" class="spinner"></div>
          <div *ngIf="!loadingSubs() && quizSubsData()">
            <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
              <span class="badge badge-success">Submitted: {{ quizSubsData().submitted }}</span>
              <span class="badge badge-danger">Not Submitted: {{ quizSubsData().nonSubmitted }}</span>
              <span class="badge badge-ghost">Expected: {{ quizSubsData().totalExpected }}</span>
            </div>
            <div class="table-wrapper" style="max-height:340px;overflow-y:auto">
              <table>
                <thead><tr><th>Student</th><th>Code</th><th>Score</th><th>Total</th><th>%</th><th>Submitted At</th></tr></thead>
                <tbody>
                  <tr *ngFor="let s of quizSubsData().submissions">
                    <td>{{ s.student.name }}</td>
                    <td><span class="badge badge-ghost">{{ s.student.studentCode }}</span></td>
                    <td><strong style="color:var(--success)">{{ s.score }}</strong></td>
                    <td>{{ s.totalPoints }}</td>
                    <td>{{ s.totalPoints>0?(s.score/s.totalPoints*100|number:'1.0-0'):0 }}%</td>
                    <td>{{ s.submittedAt | cairoDate:'full' }}</td>
                  </tr>
                  <tr *ngIf="!quizSubsData().submissions?.length"><td colspan="6" class="empty-state"><p>No submissions yet</p></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-ghost" (click)="showQuizSubs.set(false)">Close</button></div>
        </div>
      </div>

      <!-- Assignment Submissions Modal (Manager) -->
      <div class="modal-backdrop" *ngIf="showAssignSubs()" (click)="showAssignSubs.set(false)">
        <div class="modal" style="max-width:720px" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Assignment Submissions</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showAssignSubs.set(false)">✕</button></div>
          <div *ngIf="loadingSubs()" class="spinner"></div>
          <div *ngIf="!loadingSubs() && assignSubsData()">
            <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
              <span class="badge badge-success">Submitted: {{ assignSubsData().submitted }}</span>
              <span class="badge badge-danger">Not Submitted: {{ assignSubsData().nonSubmitted }}</span>
              <span class="badge badge-ghost">Expected: {{ assignSubsData().totalExpected }}</span>
            </div>
            <div class="table-wrapper" style="max-height:320px;overflow-y:auto">
              <table>
                <thead><tr><th>Student</th><th>Code</th><th>File/Link</th><th>Grade</th><th>Submitted At</th><th>Action</th></tr></thead>
                <tbody>
                  <tr *ngFor="let s of assignSubsData().items">
                    <td>{{ s.student.name }}</td>
                    <td><span class="badge badge-ghost">{{ s.student.studentCode }}</span></td>
                    <td><a *ngIf="s.fileUrl||s.link" [href]="s.fileUrl||s.link" target="_blank" class="btn btn-ghost btn-sm">{{ 'sd.open2' | t }}</a></td>
                    <td><span *ngIf="s.grade!=null" class="badge badge-success">{{ s.grade }}</span><span *ngIf="s.grade==null" style="color:var(--text-muted);font-size:.8rem">—</span></td>
                    <td>{{ s.submittedAt | cairoDate:'full' }}</td>
                    <td><button class="btn btn-ghost btn-sm" (click)="openGrade(s)">Grade</button></td>
                  </tr>
                  <tr *ngIf="!assignSubsData().items?.length"><td colspan="6" class="empty-state"><p>No submissions yet</p></td></tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="assignSubsData().missed?.length" style="margin-top:14px">
              <p style="font-size:.875rem;font-weight:600;color:var(--danger);margin-bottom:8px">Missed (past deadline):</p>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                <span *ngFor="let m of assignSubsData().missed" class="badge badge-danger">{{ m.name }} ({{ m.studentCode }})</span>
              </div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-ghost" (click)="showAssignSubs.set(false)">Close</button></div>
        </div>
      </div>

      <!-- Grade Modal -->
      <div class="modal-backdrop" *ngIf="showGradeModal()" (click)="showGradeModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>Grade Submission</h3><button class="btn btn-ghost btn-sm btn-icon" (click)="showGradeModal.set(false)">✕</button></div>
          <p style="font-size:.875rem;color:var(--text-muted);margin-bottom:14px">{{ gradingSub?.student?.name }}</p>
          <div class="form-group"><label>Grade</label><input type="number" class="form-control" [(ngModel)]="gradeForm.grade" min="0" max="100" placeholder="0-100"></div>
          <div class="form-group"><label>Feedback</label><textarea class="form-control" [(ngModel)]="gradeForm.feedback" rows="2"></textarea></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showGradeModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveGrade()">{{ 'common.save' | t }} {{ 'sd.grade' | t }}</button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .detail-grid{display:grid;grid-template-columns:1fr 340px;gap:16px;}
    @media(max-width:900px){.detail-grid{grid-template-columns:1fr;}}
    .info-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:.875rem;&:last-child{border:none;}}
    .i-icon{width:20px;text-align:center;flex-shrink:0;}.i-label{color:var(--text-muted);min-width:80px;}
    .section-sub{font-size:.875rem;font-weight:600;color:var(--text);margin:12px 0 8px;display:flex;justify-content:space-between;align-items:center;}
    .eval-item-wrap{margin-bottom:8px;}
    .eval-item{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 12px;background:var(--surface2);border-radius:8px;}
    .grade-feedback{font-size:.78rem;color:var(--text-muted);padding:8px 12px;background:var(--primary-light);border-radius:0 0 8px 8px;margin-top:-2px;}
    .att-summary{display:flex;gap:20px;font-size:.875rem;color:var(--text-muted);margin-top:8px;}
    .track-row{display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--text-muted);padding:5px 0;}
    .attach-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:8px;}
    .q-card{background:var(--surface2);border-radius:10px;padding:16px;margin-bottom:12px;border:1px solid var(--border);}
    .option-label{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);transition:all .15s;
      &.correct{border-color:var(--success);background:var(--success-light);}
      &:hover{border-color:var(--primary);}
      input[type=radio]{flex-shrink:0;}
    }
    .quiz-option{display:flex;align-items:center;padding:10px 14px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);margin-bottom:6px;font-size:.875rem;transition:all .15s;
      &.selected{border-color:var(--primary);background:var(--primary-light);color:var(--primary);}
      &:hover{border-color:var(--primary);}
    }
    .upload-progress-wrap{height:6px;background:var(--surface2);border-radius:999px;overflow:hidden;margin-top:8px;}
    .upload-progress-bar{height:100%;background:var(--primary);border-radius:999px;transition:width .2s ease;}
    .upload-success{font-size:.8rem;color:var(--success);margin-top:8px;}
    .upload-error{font-size:.8rem;color:var(--danger);margin-top:8px;}
  `]
})
export class SessionDetailComponent implements OnInit {
  private svc = inject(SessionService);
  private quizSvc = inject(QuizService);
  private assignSvc = inject(AssignmentService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private uploadSvc = inject(FileUploadService);
  private toast = inject(ToastService);

  // Assignment submission PDF upload state
  uploadProgress = signal<number | null>(null);
  uploadError = signal('');
  isUploading = signal(false);

  // Session attachment PDF upload state
  attachUploadProgress = signal<number | null>(null);
  attachUploadError = signal('');
  attachIsUploading = signal(false);

  session = signal<any>(null); loading = signal(true);
  showAttendance = signal(false); attendance = signal<any[]>([]);
  showAttachModal = signal(false); showRecordModal = signal(false);
  showAddQuiz = signal(false); showAssignModal = signal(false);
  showQuizSubs = signal(false); showAssignSubs = signal(false);
  showGradeModal = signal(false);
  showSubmitAssign = signal(false);
  loadingSubs = signal(false);
  quizSubsData = signal<any>(null); assignSubsData = signal<any>(null);
  recordLink = ''; editingAttach: any = null; editingAssign: any = null;
  attachForm: any = { title:'', attachmentType:'link', link:'', fileUrl:'' };
  quizForm: any = { title:'', type:'multiple_choice', isGraded:true, dueDate:'', questions:[] };
  assignForm: any = { title:'', description:'', isGraded:true, dueDate:'' };
  submitForm: any = { submissionType:'file', fileUrl:'', link:'', notes:'' };
  gradeForm: any = { grade:'', feedback:'' };
  gradingSub: any = null; currentAssignId: number | null = null;
  submittingAssign: any = null;
  // Track student's own submissions
  myQuizSubs: Record<number, any> = {};
  myAssignSubs: Record<number, any> = {};

  canManage() { const r=this.auth.getRole(); return r==='Admin'||r==='Coordinator'; }
  isStudent() { return this.auth.getRole()==='Student'; }
  statusBadge(s: string) { return {'finished':'badge badge-success','pending':'badge badge-warning','running':'badge badge-primary','cancelled':'badge badge-danger'}[s]||'badge badge-ghost'; }
  isPastDue(d: string|null) { return d && new Date(d) < new Date(); }
  myQuizSubmission(quizId: number) {
    const q = this.session()?.quizzes?.find((x: any) => x.id === quizId);
    return q?.mySubmission || this.myQuizSubs[quizId] || null;
  }
  myAssignSubmission(assignId: number) {
    const a = this.session()?.assignments?.find((x: any) => x.id === assignId);
    return (a?.mySubmitted ? true : null) || this.myAssignSubs[assignId] || null;
  }

  ngOnInit() { this.load(); }

  load() {
    const id = +this.route.snapshot.params['id'];
    this.svc.getSession(id).subscribe({
      next: s => {
        this.session.set(s);
        this.recordLink = s.recordLink || '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  runSession()    { this.svc.runSession(this.session().id).subscribe({ next: () => { this.load(); this.toast.success('Session started', 'Students can now join and take part.'); }, error: e => this.toast.error('Could not start session', e.error?.message) }); }
  finishSession() { this.svc.finishSession(this.session().id).subscribe({ next: () => { this.load(); this.toast.success('Session completed', 'Great work — the session is now marked as finished.'); }, error: e => this.toast.error('Could not complete session', e.error?.message || 'Take attendance first.') }); }
  cancelSession() { if(confirm('Cancel this session?')) this.svc.cancelSession(this.session().id).subscribe({ next: () => { this.load(); this.toast.warning('Session cancelled'); }, error: e => this.toast.error('Could not cancel session', e.error?.message) }); }

  openAttendance() { this.svc.getAttendance(this.session().id).subscribe(a=>{ this.attendance.set(a); this.showAttendance.set(true); }); }
  saveAttendance() { this.svc.saveAttendance(this.session().id, this.attendance()).subscribe({ next: () => { this.showAttendance.set(false); this.load(); this.toast.success('Attendance saved'); }, error: e => this.toast.error('Could not save attendance', e.error?.message) }); }

  openAddAttach() {
    this.editingAttach=null;
    this.attachForm={title:'',attachmentType:'link',link:'',fileUrl:'',uploadedName:''};
    this.attachUploadProgress.set(null); this.attachUploadError.set(''); this.attachIsUploading.set(false);
    this.showAttachModal.set(true);
  }
  editAttach(a: any) {
    this.editingAttach=a;
    this.attachForm={title:a.title,attachmentType:a.attachmentType,link:a.link||'',fileUrl:a.fileUrl||'',uploadedName:''};
    this.attachUploadProgress.set(null); this.attachUploadError.set(''); this.attachIsUploading.set(false);
    this.showAttachModal.set(true);
  }
  onAttachPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { this.attachUploadError.set('Only PDF files are allowed'); return; }
    this.attachUploadError.set(''); this.attachIsUploading.set(true); this.attachUploadProgress.set(0);
    this.uploadSvc.uploadPdf(file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.attachUploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          const body: any = event.body;
          this.attachForm.fileUrl = body.fileUrl;
          this.attachForm.uploadedName = body.originalName;
          this.attachIsUploading.set(false); this.attachUploadProgress.set(null);
        }
      },
      error: () => { this.attachUploadError.set('Upload failed. Please try again.'); this.attachIsUploading.set(false); this.attachUploadProgress.set(null); }
    });
  }
  saveAttach() {
    const id=this.session().id;
    const isEdit = !!this.editingAttach;
    const obs=isEdit?this.svc.updateAttachment(id,this.editingAttach.id,this.attachForm):this.svc.addAttachment(id,this.attachForm);
    obs.subscribe({
      next: () => { this.showAttachModal.set(false); this.load(); this.toast.success(isEdit ? 'Attachment updated' : 'Attachment added'); },
      error: e => this.toast.error('Could not save attachment', e.error?.message)
    });
  }
  deleteAttach(attId: number) { if(confirm('Delete?')) this.svc.deleteAttachment(this.session().id,attId).subscribe({ next: () => { this.load(); this.toast.success('Attachment deleted'); }, error: e => this.toast.error('Could not delete attachment', e.error?.message) }); }
  saveRecordLink() { this.svc.updateRecordLink(this.session().id,this.recordLink).subscribe({ next: () => { this.showRecordModal.set(false); this.load(); this.toast.success('Record link saved'); }, error: e => this.toast.error('Could not save record link', e.error?.message) }); }

  // datetime-local inputs are already in the device's local timezone; Date + toISOString()
  // converts correctly to UTC for the API, exactly like any standard website form.
  private localToUtcIso(localDateTime: string): string | null {
    if (!localDateTime) return null;
    return new Date(localDateTime).toISOString();
  }

  addQuestion() { this.quizForm.questions.push({questionText:'',optionA:'',optionB:'',optionC:'',optionD:'',correctAnswer:'A',points:1}); }
  removeQuestion(i: number) { this.quizForm.questions.splice(i,1); }
  saveQuiz() {
    const payload={...this.quizForm,sessionId:this.session().id,dueDate:this.localToUtcIso(this.quizForm.dueDate)};
    this.quizSvc.createQuiz(payload).subscribe({
      next: () => { this.showAddQuiz.set(false); this.quizForm={title:'',type:'multiple_choice',isGraded:true,dueDate:'',questions:[]}; this.load(); this.toast.success('Quiz created', 'Students in this session can now take it.'); },
      error: e => this.toast.error('Could not create quiz', e.error?.message)
    });
  }

  openAssignModal() {
    const ex=this.session().assignments[0];
    if(ex){ this.editingAssign=ex; this.assignForm={title:ex.title,description:ex.description||'',isGraded:ex.isGraded,dueDate:ex.dueDate?this.utcIsoToLocalInput(ex.dueDate):''}; }
    else { this.editingAssign=null; this.assignForm={title:'',description:'',isGraded:true,dueDate:''}; }
    this.showAssignModal.set(true);
  }
  saveAssignment() {
    const payload={...this.assignForm,sessionId:this.session().id,dueDate:this.localToUtcIso(this.assignForm.dueDate)};
    const isEdit = !!this.editingAssign;
    const obs=isEdit?this.assignSvc.updateAssignment(this.editingAssign.id,payload):this.assignSvc.createAssignment(payload);
    obs.subscribe({
      next: () => { this.showAssignModal.set(false); this.load(); this.toast.success(isEdit ? 'Assignment updated' : 'Assignment created', isEdit ? undefined : 'Students in this session can now submit their work.'); },
      error: e => this.toast.error('Could not save assignment', e.error?.message)
    });
  }

  // For pre-filling a datetime-local input from a UTC ISO string, shown in the device's local time
  private utcIsoToLocalInput(isoUtc: string): string {
    const d = new Date(isoUtc);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Student: submit assignment
  openSubmitAssign(a: any) {
    this.submittingAssign=a;
    this.submitForm={submissionType:'file',fileUrl:'',link:'',notes:'',uploadedName:''};
    this.uploadProgress.set(null); this.uploadError.set(''); this.isUploading.set(false);
    this.showSubmitAssign.set(true);
  }
  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { this.uploadError.set('Only PDF files are allowed'); return; }
    this.uploadError.set(''); this.isUploading.set(true); this.uploadProgress.set(0);
    this.uploadSvc.uploadPdf(file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          const body: any = event.body;
          this.submitForm.fileUrl = body.fileUrl;
          this.submitForm.uploadedName = body.originalName;
          this.isUploading.set(false); this.uploadProgress.set(null);
        }
      },
      error: () => { this.uploadError.set('Upload failed. Please try again.'); this.isUploading.set(false); this.uploadProgress.set(null); }
    });
  }
  doSubmitAssign() {
    this.assignSvc.submitAssignment(this.submittingAssign.id,this.submitForm).subscribe({
      next:()=>{ this.showSubmitAssign.set(false); this.myAssignSubs[this.submittingAssign.id]=true; this.load(); this.toast.success('Assignment submitted', 'Your coordinator will review and grade it soon.'); },
      error:e=>this.toast.error('Could not submit assignment', e.error?.message)
    });
  }

  viewQuizSubmissions(quizId: number) { this.loadingSubs.set(true); this.showQuizSubs.set(true); this.quizSvc.getSubmissions(quizId).subscribe(d=>{this.quizSubsData.set(d);this.loadingSubs.set(false);}); }
  viewAssignmentSubmissions(assignId: number) { this.currentAssignId=assignId; this.loadingSubs.set(true); this.showAssignSubs.set(true); this.assignSvc.getSubmissions(assignId).subscribe(d=>{this.assignSubsData.set(d);this.loadingSubs.set(false);}); }
  openGrade(s: any) { this.gradingSub=s; this.gradeForm={grade:s.grade||'',feedback:s.gradeFeedback||''}; this.showGradeModal.set(true); }
  saveGrade() { this.assignSvc.grade(this.currentAssignId!,this.gradingSub.id,+this.gradeForm.grade,this.gradeForm.feedback).subscribe({ next: () => { this.showGradeModal.set(false); this.viewAssignmentSubmissions(this.currentAssignId!); this.toast.success('Grade saved', 'The student can now see their grade and feedback.'); }, error: e => this.toast.error('Could not save grade', e.error?.message) }); }
}
