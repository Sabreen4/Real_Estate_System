import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  constructor(public router: Router) {}

  isAdminDashboard(): boolean {
    return this.router.url.startsWith('/admin/dashboard');
  }
}