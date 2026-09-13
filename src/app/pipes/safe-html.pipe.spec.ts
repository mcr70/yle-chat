import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { SafeHtmlPipe } from './safe-html.pipe';

@Component({
  standalone: true,
  imports: [SafeHtmlPipe],
  template: '<div id="content" [innerHTML]="html | safeHtml"></div>'
})
class SafeHtmlHostComponent {
  html = '';
}

describe('SafeHtmlPipe', () => {
  let fixture: ComponentFixture<SafeHtmlHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeHtmlHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SafeHtmlHostComponent);
  });

  // Supported HTML elements should remain available for rendering.
  it('preserves supported markup in innerHTML', () => {
    fixture.componentInstance.html = '<b>Allowed</b>';

    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('#content') as HTMLElement;

    expect(content.querySelector('b')?.textContent).toBe('Allowed');
  });

  // Executable elements and inline event handlers must be removed.
  it('removes unsafe HTML from innerHTML', () => {
    fixture.componentInstance.html = '<script>alert(1)</script><img src="x" onerror="alert(2)">';

    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('#content') as HTMLElement;

    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('[onerror]')).toBeNull();
  });

  // HTML represented by entities must be displayed as literal text.
  it('keeps escaped markup as text', () => {
    fixture.componentInstance.html = '&lt;b&gt;Decoded&lt;/b&gt;';

    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('#content') as HTMLElement;

    expect(content.querySelector('b')).toBeNull();
    expect(content.textContent).toBe('<b>Decoded</b>');
  });
});