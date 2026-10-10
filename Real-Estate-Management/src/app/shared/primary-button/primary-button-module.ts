import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryButtonComponent } from './primary-button/primary-button.component';

@NgModule({
  declarations: [PrimaryButtonComponent],
  imports: [CommonModule],
  exports:[PrimaryButtonComponent]
})
export class PrimaryButtonModule {}
