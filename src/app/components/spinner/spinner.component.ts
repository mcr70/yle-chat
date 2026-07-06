import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `<span class="spinner">🔄</span>`,
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {}