import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ToolbarComponent } from '@components/toolbar/toolbar.component';

interface ProviderOption {
  id: string;
  name: string;
  description: string;
  badgeText: string;
  badgeClass: string;
}

@Component({
  selector: 'app-provider-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, ToolbarComponent],
  templateUrl: './provider-selection.component.html',
  styleUrls: ['./provider-selection.component.scss']
})
export class ProviderSelectionComponent {
  public providers: ProviderOption[] = [
    {
      id: 'yle',
      name: 'Yle',
      description: 'Selaa ja lue Ylen uutisten keskusteluja.',
      badgeText: 'Täysi tuki',
      badgeClass: 'badge-success'
    },
    {
      id: 'hs',
      name: 'Helsingin Sanomat',
      description: 'Selaa ja lue Helsingin Sanomien artikkelikohtaisia keskusteluja.',
      badgeText: 'Anonyymi',
      badgeClass: 'badge-info'
    }
  ];

  constructor(private router: Router) {}

  selectProvider(providerId: string): void {
    this.router.navigate([`/${providerId}/comments`]);
  }
}