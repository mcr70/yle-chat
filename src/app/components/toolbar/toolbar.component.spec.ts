import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { ToolbarComponent } from './toolbar.component';
import { RefreshService } from '@app/services/resfresh.service';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let router: Router;
  let refreshService: RefreshService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService(),
        RefreshService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    refreshService = TestBed.inject(RefreshService);
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Tests navigating to home
  it('should navigate to root on goHome', () => {
    let navigatedTo = '';
    router.navigate = (commands: any[]) => {
      navigatedTo = commands[0];
      return Promise.resolve(true);
    };

    component.goHome();
    expect(navigatedTo).toBe('/');
  });

  // Tests emitting menu toggle event
  it('should emit toggleMenu event when onToggleMenu is invoked', () => {
    let emitted = false;
    component.toggleMenu.subscribe(() => {
      emitted = true;
    });

    component.onToggleMenu();
    expect(emitted).toBe(true);
  });

  // Tests modal open and close
  it('should open and close info modal and save version to localStorage', () => {
    component.openInfoModal();
    expect(component.isInfoModalOpen()).toBe(true);

    component.closeInfoModal();
    expect(component.isInfoModalOpen()).toBe(false);
    expect(localStorage.getItem('app_info_seen_version')).toBe('1.0');
  });

  // Tests refresh trigger
  it('should trigger refresh via RefreshService', () => {
    let refreshed = false;
    refreshService.refresh$.subscribe(() => {
      refreshed = true;
    });

    component.onRefresh();
    expect(refreshed).toBe(true);
    expect(component.isRefreshing()).toBe(true);
  });
});
