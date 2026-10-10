import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-logout-button',
  templateUrl: './logout-button.component.html',
  styleUrls: ['./logout-button.component.css'],
  standalone: false
})
export class LogoutButtonComponent {

  constructor(private auth: AuthService, private router: Router) {}

 public logout(): void {
    this.auth.clearAuthData();
    this.router.navigate(['/login']);
  }
}