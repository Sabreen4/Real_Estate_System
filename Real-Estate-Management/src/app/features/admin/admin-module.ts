import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SidebarModule } from '../../shared/sidebar/sidebar-module';
import { FormModule } from '../../shared/form/form-module';
import { ActionButtonModule } from '../../shared/action-button/action-button-module';
import { ConfirmDeleteModalModule } from '../../shared/confirm-delete-modal/confirm-delete-modal-module';
import { StatusBadgeModule } from '../../shared/status-badge/status-badge-module';
import { LoaderModule } from '../../shared/loader/loader-module';
import { ReactiveFormsModule } from '@angular/forms';

import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { AdminUsersComponent } from './components/users/users.component';
import { ToastModule } from 'src/app/shared/toast/toast-module';
import { EmptyStateModule } from 'src/app/shared/empty-state/empty-state-module';
import { PaginatorModule } from 'src/app/shared/paginator/paginator-module';
import { RegisterComponent } from './components/register/register.component';
import { BackButtonModule } from 'src/app/shared/back-button/back-button-module';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
        { path: 'register',     component: RegisterComponent },
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    RegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SidebarModule,
    FormModule,
    ActionButtonModule,
    ConfirmDeleteModalModule,
    StatusBadgeModule,
    LoaderModule,
    ToastModule,
    EmptyStateModule,
    PaginatorModule,
    ReactiveFormsModule, 
    BackButtonModule
     
  ],
})
export class AdminModule {}