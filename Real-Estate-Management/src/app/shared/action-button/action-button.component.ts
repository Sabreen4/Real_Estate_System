import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css'],
  standalone:false
})
export class ActionButtonsComponent {
  @Input() editLabel   = 'Edit';
  @Input() deleteLabel = 'Delete';
  @Input() editDisabled   = false;
  @Input() deleteDisabled = false;

  @Output() editClicked   = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
}
