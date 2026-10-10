import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css'],
  standalone: false
})
export class PrimaryButtonComponent {

  /** Button label text */
  @Input() label = 'Submit';

  /** Optional SVG icon path string (e.g. a plus icon) */
  @Input() icon: 'plus' | 'refresh' | 'none' = 'none';

  /** Disabled state */
  @Input() disabled = false;

  /** Colour variant */
  @Input() variant: 'primary' | 'danger' | 'secondary' = 'primary';

  @Output() clicked = new EventEmitter<void>();

   public onClick(): void {
    if (!this.disabled) this.clicked.emit();
  }
}