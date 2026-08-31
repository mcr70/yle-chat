import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `<span *ngIf="visible" class="spinner">🔄</span>`,
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
  // Oletusminimiaika 1000 ms. Voidaan myös ylikirjoittaa tarvittaessa ([minDisplayTime]="500")
  @Input() minDisplayTime: number = 1000;

  visible: boolean = false;
  private showStartTime: number = 0;
  private hideTimeout: any = null;

  @Input() 
  set show(value: boolean) {
    if (value) {
      // clear timeout if it's already set, to avoid hiding the spinner prematurely
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }

      this.showStartTime = Date.now();
      this.visible = true;
    } 
    else if (this.visible) {
      // once the spinner is visible, we need to check if the minimum display time has passed
      const elapsedTime = Date.now() - this.showStartTime;
      const remainingTime = this.minDisplayTime - elapsedTime;

      if (remainingTime > 0) {
        // if the minimum display time hasn't passed, set a timeout to hide the spinner after the remaining time
        this.hideTimeout = setTimeout(() => {
          this.visible = false;
        }, remainingTime);
      } else {
        // otherwise, hide the spinner immediately
        this.visible = false;
      }
    }
  }
}