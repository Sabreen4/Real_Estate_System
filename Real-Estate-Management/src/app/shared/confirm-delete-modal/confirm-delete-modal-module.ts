import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal.component';

@NgModule({
  declarations: [ConfirmDeleteModalComponent],
  imports: [CommonModule],
  exports: [ConfirmDeleteModalComponent]
})
export class ConfirmDeleteModalModule {}
