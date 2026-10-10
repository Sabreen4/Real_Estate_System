import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

import { App } from './app';
import { AppRoutingModule } from './app-routing-module';

import { NavbarModule } from './shared/navbar/navbar-module';
import { LogoutButtonModule } from './shared/logout-button/logout-button-module';
import { SidebarModule } from './shared/sidebar/sidebar-module';
import { SearchBarModule } from './shared/search-bar/search-bar-module';
import { PrimaryButtonModule } from './shared/primary-button/primary-button-module';
import { FormModule } from './shared/form/form-module';
import { ActionButtonModule } from './shared/action-button/action-button-module';
import { ConfirmDeleteModalModule } from './shared/confirm-delete-modal/confirm-delete-modal-module';
import { StatusBadgeModule } from './shared/status-badge/status-badge-module';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { LoaderModule } from './shared/loader/loader-module';
import { ToastModule } from './shared/toast/toast-module';
import { BackButtonModule } from './shared/back-button/back-button-module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [App],

  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    FormModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,

    LoaderModule,
    NavbarModule,
    SidebarModule,
    LogoutButtonModule,
    SearchBarModule,
    PrimaryButtonModule,
    ActionButtonModule,
    ConfirmDeleteModalModule,
    StatusBadgeModule,
    ToastModule,
    BackButtonModule,
    MatIconModule,

    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      preventDuplicates: true,
    }),
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],

  bootstrap: [App],
})
export class AppModule {}
