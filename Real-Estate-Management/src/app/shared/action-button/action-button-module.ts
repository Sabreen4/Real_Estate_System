import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionButtonsComponent } from './action-button.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [ActionButtonsComponent],
  imports: [CommonModule,MatIconModule],
  exports: [ActionButtonsComponent]
})
export class ActionButtonModule {}
