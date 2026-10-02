import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite">
      <div *ngFor="let t of toastSvc.toasts()" class="toast" [class]="'toast-' + t.type" (click)="toastSvc.dismiss(t.id)">
        <div class="toast-icon">
          <svg *ngIf="t.type==='success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          <svg *ngIf="t.type==='error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <svg *ngIf="t.type==='warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          <svg *ngIf="t.type==='info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-message" *ngIf="t.message">{{ t.message }}</div>
        </div>
        <button class="toast-close" (click)="toastSvc.dismiss(t.id); $event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="toast-timer" *ngIf="t.duration > 0" [style.animationDuration]="t.duration + 'ms'"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }
    @media (max-width: 600px) {
      .toast-stack { left: 12px; right: 12px; top: 12px; max-width: none; }
    }

    .toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06);
      overflow: hidden;
      pointer-events: auto;
      cursor: pointer;
      animation: toast-in .28s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(24px) scale(.96); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    .toast-icon {
      width: 30px; height: 30px; border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
      svg { width: 16px; height: 16px; }
    }
    .toast-success .toast-icon { background: var(--success-light); color: var(--success); }
    .toast-error   .toast-icon { background: var(--danger-light); color: var(--danger); }
    .toast-warning .toast-icon { background: var(--warning-light); color: var(--warning); }
    .toast-info    .toast-icon { background: var(--primary-light); color: var(--primary); }

    .toast-body { flex: 1; min-width: 0; padding-right: 4px; }
    .toast-title { font-size: .875rem; font-weight: 700; color: var(--text); line-height: 1.35; }
    .toast-message { font-size: .8rem; color: var(--text-muted); margin-top: 2px; line-height: 1.4; }

    .toast-close {
      flex-shrink: 0; background: none; border: none; cursor: pointer;
      color: var(--text-muted); padding: 2px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      opacity: .6; transition: opacity .15s, background .15s;
      svg { width: 14px; height: 14px; }
      &:hover { opacity: 1; background: var(--surface2); }
    }

    .toast-timer {
      position: absolute;
      left: 0; bottom: 0;
      height: 3px;
      background: currentColor;
      opacity: .35;
      animation-name: toast-drain;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
    .toast-success .toast-timer { color: var(--success); }
    .toast-error   .toast-timer { color: var(--danger); }
    .toast-warning .toast-timer { color: var(--warning); }
    .toast-info    .toast-timer { color: var(--primary); }
    @keyframes toast-drain {
      from { width: 100%; }
      to   { width: 0%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast { animation: none; }
      .toast-timer { animation: none; display: none; }
    }
  `]
})
export class ToastContainerComponent {
  toastSvc = inject(ToastService);
}
