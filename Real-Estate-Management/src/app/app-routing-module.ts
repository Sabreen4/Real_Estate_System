import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

const routes: Routes = [

  // =========================
  // DEFAULT ROUTE
  // =========================
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // =========================
  // AUTH — lazy via AuthModule
  // =========================
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule)
  },

  // =========================
  // ADMIN — lazy via AdminModule
  // =========================
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' },
    loadChildren: () =>
      import('./features/admin/admin-module')
        .then(m => m.AdminModule)
  },

  // =========================
  // AGENT — lazy via AgentModule
  // =========================
  {
    path: 'agent',
    canActivate: [AuthGuard],
    data: { role: 'AGENT' },
    loadChildren: () =>
      import('./features/agent/agent-module')
        .then(m => m.AgentModule)
  },

  // =========================
  // BUYER — lazy via BuyerModule
  // =========================
  {
    path: 'buyer',
    canActivate: [AuthGuard],
    data: { role: 'BUYER' },
    loadChildren: () =>
      import('./features/buyer/buyer-module')
        .then(m => m.BuyerModule)
  },

  // =========================
  // WILDCARD
  // =========================
  { path: '**', redirectTo: 'login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }