import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  toasts = signal<Toast[]>([]);

  private push(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  success(title: string, message?: string, duration = 4000) { return this.push('success', title, message, duration); }
  error(title: string, message?: string, duration = 5000) { return this.push('error', title, message, duration); }
  info(title: string, message?: string, duration = 4000) { return this.push('info', title, message, duration); }
  warning(title: string, message?: string, duration = 4500) { return this.push('warning', title, message, duration); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}
