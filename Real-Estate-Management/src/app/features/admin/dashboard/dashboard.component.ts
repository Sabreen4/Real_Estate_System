import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {

  public users:          User[] = [];
  public successMessage: string = '';
  public errorMessage:   string = '';

  constructor(
    private userService:  UserService,
    private authService:  AuthService,
    private router:       Router,
    private cdr:          ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    const role = this.authService.getRole()?.trim().toUpperCase();
    if (role !== 'ADMIN') { this.router.navigate(['/login']); return; }
    this.getAllUsers();
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────
  public getAllUsers(): void {
    const token = this.authService.getToken() || '';
    this.userService.getAllUsers(token).subscribe({
      next: (res: User[]) => {
        this.users = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  public refreshData(): void {
    this.getAllUsers();
    this.showSuccess('Data refreshed!');
  }

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  public goToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  public goToAddUser(): void {
    this.router.navigate(['/admin/users'], { queryParams: { action: 'add' } });
  }

  public goToAgents(): void {
    this.router.navigate(['/admin/users'], { queryParams: { role: 'AGENT' } });
  }

  // ── STATS HELPERS ──────────────────────────────────────────────────────────
  public countByRole(roleName: string): number {
    const roleIdMap: Record<string, number> = { ADMIN: 1, AGENT: 2, BUYER: 3 };
    return this.users.filter(u =>
      (u.roleName || '').toUpperCase() === roleName ||
      u.roleId === roleIdMap[roleName]
    ).length;
  }

  public getPercent(roleName: string): number {
    if (!this.users.length) return 0;
    return (this.countByRole(roleName) / this.users.length) * 100;
  }

  public get recentUsers(): User[] {
    return [...this.users].slice(-6).reverse();
  }

  public get agentCoverage(): number {
    if (!this.users.length) return 0;
    return Math.min((this.countByRole('AGENT') / Math.max(this.countByRole('BUYER'), 1)) * 100, 100);
  }

  public get agentToBuyerRatio(): string {
    const agents = this.countByRole('AGENT');
    const buyers = this.countByRole('BUYER');
    if (!agents && !buyers) return '—';
    if (!buyers) return `${agents}:0`;
    const gcd = this.gcd(agents, buyers);
    return `${agents / gcd}:${buyers / gcd}`;
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // ── DISPLAY HELPERS ────────────────────────────────────────────────────────
  public getInitials(user: User): string {
    const f = (user.firstName || '').charAt(0).toUpperCase();
    const l = (user.lastName  || '').charAt(0).toUpperCase();
    return f + l || '?';
  }

  public getRoleDisplay(user: User): string {
    if (user.roleName) {
      const r = user.roleName.toUpperCase();
      return r === 'ADMIN' ? 'Admin' : r === 'AGENT' ? 'Agent' : r === 'BUYER' ? 'Buyer' : user.roleName;
    }
    const map: Record<number, string> = { 1: 'Admin', 2: 'Agent', 3: 'Buyer' };
    return user.roleId != null ? map[user.roleId] ?? 'Unknown' : 'Unknown';
  }

  public getRolePillClass(user: User): string {
    const roleFromName = (user.roleName || '').toUpperCase();
    const roleFromId: Record<number, string> = { 1: 'ADMIN', 2: 'AGENT', 3: 'BUYER' };
    const role = roleFromName || (user.roleId != null ? roleFromId[user.roleId] : '') || '';
    if (role === 'ADMIN') return 'pill-admin';
    if (role === 'AGENT') return 'pill-agent';
    if (role === 'BUYER') return 'pill-buyer';
    return 'pill-default';
  }

  // ── TOAST ──────────────────────────────────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3500);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3500);
  }
}