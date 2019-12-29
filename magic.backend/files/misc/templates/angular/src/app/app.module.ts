
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { JwtModule } from '@auth0/angular-jwt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { environment } from 'src/environments/environment';
import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
import { CreateRoleDialogComponent } from './components/auth/modals/create-role-dialog';
import { CreateUserDialogComponent } from './components/auth/modals/create-user-dialog';
[[imports]]

export function tokenGetter() {
  return localStorage.getItem('jwt_token');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuthComponent,
    CreateRoleDialogComponent,
    CreateUserDialogComponent,
[[declarations]]
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: [environment.apiDomain],
      }
    }),
    MatButtonModule,
    MatSidenavModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatDialogModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    CreateRoleDialogComponent,
    CreateUserDialogComponent,
  ]
})
export class AppModule { }
