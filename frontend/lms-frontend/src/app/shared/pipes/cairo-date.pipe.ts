import { Pipe, PipeTransform } from '@angular/core';

// Renders dates using the VIEWER's local device timezone — exactly like any normal website.
// The backend always stores and sends UTC ISO strings; JS Date + toLocale* automatically
// convert to whatever timezone the browser/OS is set to. No hardcoded offset.
@Pipe({ name: 'cairoDate', standalone: true })
export class CairoDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'date' | 'time' | 'datetime' | 'short' | 'full' = 'datetime'): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';

    switch (format) {
      case 'date':
        return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
      case 'time':
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
      case 'short':
        return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
      case 'full':
        return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      case 'datetime':
      default:
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
}
