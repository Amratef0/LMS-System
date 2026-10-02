import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { ToastService } from '../../../core/services/toast.service';
import { timeout } from 'rxjs/operators';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface QuizOption { value: string; label: string; }
interface QuizQuestionVM {
  id: number;
  questionText: string;
  points: number;
  options: QuizOption[];
}

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page-header" style="display:flex;align-items:center;gap:12px">
      <a [routerLink]="['/sessions', sessionId]" class="btn btn-ghost btn-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M15 18l-6-6 6-6"/></svg>
        Back to Session
      </a>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <div *ngIf="loadError()" class="card" style="max-width:520px;margin:40px auto;text-align:center;padding:40px 24px">
      <div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">Could not load quiz</h3>
      <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:20px">{{ loadError() }}</p>
      <a [routerLink]="['/sessions', sessionId]" class="btn btn-primary">{{ 'tq.backToSession' | t }}</a>
    </div>

    <ng-container *ngIf="!loading() && !loadError() && quiz()">
      <div class="card" style="max-width:720px;margin:0 auto">
        <div class="card-header">
          <div>
            <h2 style="font-size:1.25rem;font-weight:700">{{ quiz().title }}</h2>
            <p style="font-size:.8rem;color:var(--text-muted);margin-top:4px">
              {{ questions.length }} question{{ questions.length === 1 ? '' : 's' }} · {{ totalPoints }} points total
            </p>
          </div>
        </div>

        <div class="card-body">
          <div *ngFor="let q of questions; let i = index" class="q-block">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:10px">
              <strong style="font-size:.95rem">Q{{ i + 1 }}. {{ q.questionText }}</strong>
              <span class="badge badge-ghost" style="flex-shrink:0">{{ q.points }} pts</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <label *ngFor="let opt of q.options" class="quiz-option" [class.selected]="answers[q.id] === opt.value">
                <input type="radio" [name]="'q' + q.id" [value]="opt.value" [(ngModel)]="answers[q.id]" style="margin-right:10px">
                <span>{{ opt.value }}. {{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div class="answer-summary">
            {{ 'tq.answered' | t }} {{ answeredCount() }} / {{ questions.length }}
          </div>

          <div class="btn-row">
            <a [routerLink]="['/sessions', sessionId]" class="btn btn-ghost">Cancel</a>
            <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()">
              {{ submitting() ? ('tq.submitting' | t) : ('tq.submitQuiz' | t) }}
            </button>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Result overlay -->
    <div class="modal-backdrop" *ngIf="result()">
      <div class="modal" style="text-align:center;max-width:380px">
        <div style="font-size:3rem;margin-bottom:8px">🎉</div>
        <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:8px">{{ 'tq.submitted' | t }}</h3>
        <div style="font-size:2rem;font-weight:800;color:var(--primary);margin:16px 0">
          {{ result().score }} / {{ result().totalPoints }}
        </div>
        <div style="font-size:.875rem;color:var(--text-muted);margin-bottom:24px">
          {{ resultPercent() }}% Score
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" (click)="goBackToSession()">
          Back to Session
        </button>
      </div>
    </div>
  `,
  styles: [`
    .q-block { padding: 16px; background: var(--surface2); border-radius: 10px; margin-bottom: 14px; border: 1px solid var(--border); }
    .quiz-option { display: flex; align-items: center; padding: 11px 14px; border-radius: 8px; cursor: pointer; border: 1.5px solid var(--border); font-size: .9rem; transition: all .15s; background: var(--surface);
      &.selected { border-color: var(--primary); background: var(--primary-light); color: var(--primary); font-weight: 500; }
      &:hover { border-color: var(--primary); }
    }
    .answer-summary { font-size: .85rem; color: var(--text-muted); text-align: center; margin: 16px 0; }
    .btn-row { display: flex; gap: 10px; justify-content: flex-end; }
  `]
})
export class TakeQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizSvc = inject(QuizService);
  private toast = inject(ToastService);

  quizId = 0;
  sessionId = 0;
  quiz = signal<any>(null);
  questions: QuizQuestionVM[] = [];
  totalPoints = 0;
  answers: Record<number, string> = {};
  loading = signal(true);
  loadError = signal('');
  submitting = signal(false);
  result = signal<any>(null);

  ngOnInit() {
    this.quizId = +this.route.snapshot.params['quizId'];
    this.sessionId = +this.route.snapshot.params['id'];

    if (!this.quizId) {
      this.loadError.set('Invalid quiz link.');
      this.loading.set(false);
      return;
    }

    this.quizSvc.getQuiz(this.quizId).pipe(timeout(15000)).subscribe({
      next: (d: any) => {
        if (!d) {
          this.loadError.set('Quiz data could not be loaded.');
          this.loading.set(false);
          return;
        }
        if (!d.questions || d.questions.length === 0) {
          this.loadError.set('This quiz has no questions yet. Please contact your coordinator.');
          this.loading.set(false);
          return;
        }
        this.quiz.set(d);
        this.totalPoints = d.totalPoints || 0;
        // Build a plain view-model ONCE here — never recompute inside the template
        this.questions = d.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          points: q.points,
          options: this.buildOptions(q)
        }));
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.name === 'TimeoutError'
          ? 'The request timed out. Please check your connection and try again.'
          : (err?.error?.message || 'Could not load quiz. Please try again.');
        this.loadError.set(msg);
        this.loading.set(false);
      }
    });
  }

  private buildOptions(q: any): QuizOption[] {
    const opts: QuizOption[] = [];
    if (q.optionA) opts.push({ value: 'A', label: q.optionA });
    if (q.optionB) opts.push({ value: 'B', label: q.optionB });
    if (q.optionC) opts.push({ value: 'C', label: q.optionC });
    if (q.optionD) opts.push({ value: 'D', label: q.optionD });
    return opts;
  }

  answeredCount(): number {
    return Object.keys(this.answers).filter(k => !!this.answers[+k]).length;
  }

  resultPercent(): number {
    const r = this.result();
    if (!r || !r.totalPoints) return 0;
    return Math.round((r.score / r.totalPoints) * 100);
  }

  submit() {
    if (this.submitting()) return;
    const unanswered = this.questions.length - this.answeredCount();
    if (unanswered > 0) {
      const proceed = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!proceed) return;
    }
    this.submitting.set(true);
    const answers = Object.entries(this.answers)
      .filter(([, ans]) => !!ans)
      .map(([qId, ans]) => ({ questionId: +qId, answer: ans }));

    this.quizSvc.submitQuiz(this.quizId, answers).pipe(timeout(15000)).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        this.result.set(res);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error('Could not submit quiz', err?.error?.message || 'Please check your connection and try again.');
      }
    });
  }

  goBackToSession() {
    this.router.navigate(['/sessions', this.sessionId]);
  }
}
