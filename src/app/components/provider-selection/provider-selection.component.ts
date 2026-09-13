import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ToolbarComponent } from '@components/toolbar/toolbar.component';

interface ProviderOption {
  id: string;
  name: string;
  descriptionKey: string;
  badgeTextKey: string;
  badgeClass: string;
}

@Component({
  selector: 'app-provider-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, ToolbarComponent, TranslatePipe],
  templateUrl: './provider-selection.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./provider-selection.component.scss']
})
export class ProviderSelectionComponent {
  public providers: ProviderOption[] = [
    {
      id: 'yle',
      name: 'Yle',
      descriptionKey: 'PROVIDERS.YLE_DESCRIPTION',
      badgeTextKey: 'PROVIDERS.FULL_SUPPORT',
      badgeClass: 'badge-success'
    },
    {
      id: 'hs',
      name: 'Helsingin Sanomat',
      descriptionKey: 'PROVIDERS.HS_DESCRIPTION',
      badgeTextKey: 'PROVIDERS.ANONYMOUS',
      badgeClass: 'badge-info'
    },
    {
      id: 'hn',
      name: 'Hacker News',
      descriptionKey: 'PROVIDERS.HN_DESCRIPTION',
      badgeTextKey: 'PROVIDERS.ANONYMOUS',
      badgeClass: 'badge-info'
    }
  ];

  constructor(private router: Router) {}

  selectProvider(providerId: string): void {
    this.router.navigate([`/${providerId}/comments`]);
  }
}