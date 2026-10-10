import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoginComponent } from './components/login/login.component';
import { AuthRoutingModule } from './auth-routing-module';
import { FormModule } from '../../shared/form/form-module';
import { ToastModule } from 'src/app/shared/toast/toast-module';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    VerifyOtpComponent,
    ResetPasswordComponent,
  ],
  imports: [CommonModule, FormsModule, FormModule, AuthRoutingModule, ToastModule],
})
export class AuthModule {}
