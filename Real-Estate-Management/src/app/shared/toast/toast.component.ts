import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  @Input() successMessage = '';
  @Input() errorMessage   = '';
}