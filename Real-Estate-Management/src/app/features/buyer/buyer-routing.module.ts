import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuyerLayoutComponent } from '../../layouts/buyer-layout/buyer-layout.component';

import { DashboardComponent } from './dashboard/dashboard.component';
import { OfferPageComponent } from './pages/offer-page/offer-page.component';
import { PaymentPageComponent } from './pages/payment-page/payment-page.component';

const routes: Routes = [
  {
    path: '',
    component: BuyerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'offer', component: OfferPageComponent },
      { path: 'payment', component: PaymentPageComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuyerRoutingModule {}