import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [],
  template: `@if (visible) {<span class="spinner">🔄</span>}`,
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
  // Default minimum display time is 1000 ms. Can also be overridden if needed ([minDisplayTime]="500")
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