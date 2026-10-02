import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private langSvc = inject(LanguageService);

  transform(key: string, ...params: string[]): string {
    // Reading the signal here makes Angular re-run this pipe whenever the language changes,
    // because the pipe is impure and the component re-renders on signal changes that touch the DOM.
    this.langSvc.lang();
    return this.langSvc.translate(key, params);
  }
}
