import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AgentLayoutComponent } from '../../layouts/agent-layout/agent-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgentAppointmentsPageComponent } from './pages/appointments-page/appointments-page.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { OffersPageComponent } from './pages/offer-page/offer-page.component'; // ✅ import the PAGE
import { ReportComponent } from './components/report/report.component';

const routes: Routes = [
  {
    path: '',
    component: AgentLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'agent-appointments', component: AgentAppointmentsPageComponent },
      { path: 'agent-offer', component: OffersPageComponent }, 
      { path: 'report',component: ReportComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgentRoutingModule {}