import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // <-- TUO appConfig
import { AppComponent } from './app/app.component';
// import { provideHttpClient } from '@angular/common/http'; // <-- TÄMÄ EI ENÄÄ TARVITA TÄSSÄ

bootstrapApplication(AppComponent, appConfig) // <-- KÄYTÄ appConfig-MUUTTUJAA!
  .catch((err) => console.error(err));