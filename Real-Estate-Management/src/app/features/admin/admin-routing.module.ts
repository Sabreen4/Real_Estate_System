// In your admin-routing.module.ts (or wherever admin routes are defined)

import { Routes } from "@angular/router";
import { AdminLayoutComponent } from "../../layouts/admin-layout/admin-layout.component";
import { AdminDashboardComponent } from "./dashboard/dashboard.component";
import { AdminUsersComponent } from "./components/users/users.component";

const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users',     component: AdminUsersComponent },   // ← ADD THIS
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];