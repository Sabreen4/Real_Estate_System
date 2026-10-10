import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SearchBarModule } from '../../shared/search-bar/search-bar-module';
import { SidebarModule } from '../../shared/sidebar/sidebar-module';
import { LoaderModule } from '../../shared/loader/loader-module';

import { BuyerRoutingModule } from './buyer-routing.module';

// Layout
import { BuyerLayoutComponent } from '../../layouts/buyer-layout/buyer-layout.component';

// Pages
import { DashboardComponent } from './dashboard/dashboard.component';
import { OfferPageComponent } from './pages/offer-page/offer-page.component';
import { PaymentPageComponent } from './pages/payment-page/payment-page.component';

// Components
import { AppointmentComponent } from './components/appointment/appointment.component';
import { OfferComponent } from './components/offer/offer.component';
import { PaymentComponent } from './components/payment/payment.component';
import { DatePickerComponent } from './components/appointment/date-picker.component';
import { TimePickerComponent } from './components/appointment/time-picker.component';
import { ToastModule } from 'src/app/shared/toast/toast-module';
import { EmptyStateModule } from 'src/app/shared/empty-state/empty-state-module';
import { PaginatorModule } from 'src/app/shared/paginator/paginator-module';
import { ImageLightboxModule } from 'src/app/shared/image-lightbox/image-lightbox-module';
import { PropertyDetailModalModule } from 'src/app/shared/property-detail-modal/property-detail-modal-module';
import { BackButtonModule } from 'src/app/shared/back-button/back-button-module';

// add to imports array:

@NgModule({
  declarations: [
    BuyerLayoutComponent,

    DashboardComponent,

    OfferPageComponent,
    PaymentPageComponent,

    AppointmentComponent,
    OfferComponent,
    PaymentComponent,
    DatePickerComponent,
     TimePickerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SearchBarModule,
    SidebarModule,
    BuyerRoutingModule,
    LoaderModule,
    ToastModule,
    EmptyStateModule,
    PaginatorModule,
    ImageLightboxModule,
    PropertyDetailModalModule,
    BackButtonModule
  ],
})
export class BuyerModule {}
