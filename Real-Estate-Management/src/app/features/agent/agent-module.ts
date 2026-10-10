import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SearchBarModule } from '../../shared/search-bar/search-bar-module';
import { SidebarModule } from '../../shared/sidebar/sidebar-module';

import { AgentRoutingModule } from './agent-routing.module';

import { ActionButtonModule } from '../../shared/action-button/action-button-module';
import { ConfirmDeleteModalModule } from '../../shared/confirm-delete-modal/confirm-delete-modal-module';
import { StatusBadgeModule } from '../../shared/status-badge/status-badge-module';
import { LoaderModule } from '../../shared/loader/loader-module';

// Components
import { AgentLayoutComponent } from '../../layouts/agent-layout/agent-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgentAppointmentsComponent } from './components/agent-appointments/agent-appointments.component';
import { AgentAppointmentsPageComponent } from './pages/appointments-page/appointments-page.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { AgentOffersComponent } from './components/agent-offer/agent-offer.component';
import { OffersPageComponent } from './pages/offer-page/offer-page.component';
import { ToastModule } from 'src/app/shared/toast/toast-module';
import { EmptyStateModule } from 'src/app/shared/empty-state/empty-state-module';
import { PaginatorModule } from 'src/app/shared/paginator/paginator-module';
import { ImageLightboxModule } from 'src/app/shared/image-lightbox/image-lightbox-module';
import { ReportComponent } from './components/report/report.component';
import { BackButtonModule } from 'src/app/shared/back-button/back-button-module';

@NgModule({
  declarations: [
    AgentLayoutComponent,
    DashboardComponent,
    AgentAppointmentsComponent,
    AgentAppointmentsPageComponent,
    PropertiesComponent,
    AgentOffersComponent,
    OffersPageComponent,
    ReportComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    SearchBarModule,
    SidebarModule,
    AgentRoutingModule,
    ActionButtonModule,
    ConfirmDeleteModalModule,
    StatusBadgeModule,
    LoaderModule,
    ToastModule,
    EmptyStateModule,
    PaginatorModule,
    ImageLightboxModule,
    BackButtonModule
  ],
})
export class AgentModule {}
