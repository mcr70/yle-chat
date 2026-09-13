import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Decode HTML entities while keeping HTML tags intact
    return this.decodeHTMLEntities(value);
  }

  private decodeHTMLEntities(text: string): string {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }
}