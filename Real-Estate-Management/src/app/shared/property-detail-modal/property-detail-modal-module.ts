import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { PropertyDetailModalComponent } from './property-detail-modal.component';

@NgModule({
  declarations: [PropertyDetailModalComponent],
  imports:      [CommonModule],
  exports:      [PropertyDetailModalComponent]
})
export class PropertyDetailModalModule {}