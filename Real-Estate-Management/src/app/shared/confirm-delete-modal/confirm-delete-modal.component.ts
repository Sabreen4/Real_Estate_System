import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  templateUrl: './confirm-delete-modal.component.html',
  styleUrls: ['./confirm-delete-modal.component.css'],
  standalone:false
})
export class ConfirmDeleteModalComponent {
  @Input() visible      = false;
  @Input() title        = 'Delete?';
  @Input() description  = '';
  @Input() confirmLabel = 'Yes, Delete';
  @Input() isLoading    = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
