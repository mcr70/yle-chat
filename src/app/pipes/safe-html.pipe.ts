import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    // Decode HTML entities while keeping HTML tags intact
    const decoded = this.decodeHTMLEntities(value);

    // Sanitize and bypass security trust for clean HTML rendering
    return this.sanitizer.bypassSecurityTrustHtml(decoded);
  }

  private decodeHTMLEntities(text: string): string {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }
}