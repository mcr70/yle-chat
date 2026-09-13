import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { ProviderManager } from './provider';
import { YleProvider } from '@providers/yle/yle-provider.service';
import { HSProvider } from '@providers/hs/hs-provider.service';
import { HNProvider } from '@providers/hacker-news/hn-provider.service';

describe('ProviderManager', () => {
  let providerManager: ProviderManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ProviderManager,
        YleProvider,
        HSProvider,
        HNProvider
      ]
    });

    providerManager = TestBed.inject(ProviderManager);
  });

  // Verifies that ProviderManager is instantiated
  it('should be created', () => {
    expect(providerManager).toBeTruthy();
  });

  // Verifies resolving supported providers by ID
  it('should return correct provider for registered ids', () => {
    const yle = providerManager.getProvider('yle');
    expect(yle.id).toBe('yle');

    const hs = providerManager.getProvider('hs');
    expect(hs.id).toBe('hs');

    const hn = providerManager.getProvider('hn');
    expect(hn.id).toBe('hn');
  });

  // Verifies throwing error on unknown provider ID
  it('should throw an error for unsupported provider id', () => {
    expect(() => {
      providerManager.getProvider('unknown-provider');
    }).toThrow(/not supported/);
  });
});
