import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-shared-user-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  standalone: false
})
export class FormComponent {

  /** Two-way bound data object — parent passes its own model here */
  @Input() data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    role: string;
  }  = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: ''
  };

  /**
   * Pass the roles list to show the role dropdown.
   * Pass an empty array [] to hide it (e.g. public register page
   * where the user picks their own role separately).
   */
  @Input() roles: string[] = [];

  showPassword = false;
  showConfirmPassword = false;
}