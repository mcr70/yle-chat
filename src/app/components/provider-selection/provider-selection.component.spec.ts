import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { ProviderSelectionComponent } from './provider-selection.component';

describe('ProviderSelectionComponent', () => {
  let component: ProviderSelectionComponent;
  let fixture: ComponentFixture<ProviderSelectionComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderSelectionComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderSelectionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Verifies that default providers list is available
  it('should contain Yle, HS, and HN providers', () => {
    const providerIds = component.providers.map(p => p.id);
    expect(providerIds).toContain('yle');
    expect(providerIds).toContain('hs');
    expect(providerIds).toContain('hn');
  });

  // Tests routing to comments page when selecting a provider
  it('should navigate to provider comments route on selectProvider', () => {
    let navigatedTo = '';
    router.navigate = (commands: any[]) => {
      navigatedTo = commands[0];
      return Promise.resolve(true);
    };

    component.selectProvider('yle');
    expect(navigatedTo).toBe('/yle/comments');
  });
});
