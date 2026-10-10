import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: false,
  templateUrl: './empty-state.component.html',  
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
  @Input() ctaLabel = '';
  @Output() ctaClicked = new EventEmitter<void>();
}