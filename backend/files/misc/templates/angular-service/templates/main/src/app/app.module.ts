 // Common imports from Angular ++.
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

// Application specifics imports.
import { AppComponent } from './components/app/app.component';
import { environment } from 'src/environments/environment';

// Your main Angular module.
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem('jwt_token'),
        whitelistedDomains: [environment.apiDomain],
      }
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
