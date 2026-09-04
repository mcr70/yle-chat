# Creating providers

Following these instructions helps to get started with provider creation.
First, create a sub-folder for the provider and implement needed interfaces
from `@spp/models/*`. Not every interface needs to be implemented.

While implementing the `Provider`interface, express what is supported and what is not
```
  readonly capabilities: ProviderCapabilities = {
    supportsAuth: false,
    supportsUserHistory: false,
    supportsArticleListing: true,
    supportsLiking: false,
    supportsReplying: false
  };
```

Individual service implmentations vary according to provider.

## Registering provider

To bootstrap your provider into existence, in `ProviderManager` add your new 
provider 
```
export class ProviderManager {
  private providers = new Map<string, Provider>();

  constructor(
    private yleProvider: YleProvider,
    private hsProvider: HSProvider,
    private hnProvider: HNProvider
  ) {
    this.providers.set(this.yleProvider.id, this.yleProvider);
    this.providers.set(this.hsProvider.id, this.hsProvider);
    this.providers.set(this.hnProvider.id, this.hnProvider);
  }
```

In `ProviderSelectionComponent`, provide metadata for the provider
```
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
    },
    {
      id: 'hn',
      name: 'Hacker News',
      description: 'Lue Hacker Newsin keskusteluja',
      badgeText: 'Anonyymi',
      badgeClass: 'badge-info'
    }
  ];
```

# That's about it