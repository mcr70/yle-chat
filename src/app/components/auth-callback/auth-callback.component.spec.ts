import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthCallbackComponent } from './auth-callback.component';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Verifies message posting to opener window if present
  it('should post message to opener window and close if window.opener exists', () => {
    let messageSent: any = null;
    let closed = false;

    const mockOpener = {
      postMessage: (msg: any) => {
        messageSent = msg;
      }
    };

    const originalOpener = window.opener;
    const originalClose = window.close;

    try {
      (window as any).opener = mockOpener;
      window.close = () => {
        closed = true;
      };

      component.ngOnInit();

      expect(messageSent?.type).toBe('SANOMA_AUTH_SUCCESS');
      expect(closed).toBe(true);
    } finally {
      (window as any).opener = originalOpener;
      window.close = originalClose;
    }
  });
});
