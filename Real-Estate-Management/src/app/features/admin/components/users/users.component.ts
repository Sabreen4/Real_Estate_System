import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { editUser } from 'src/app/core/models/editUser.model';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: false
})
export class AdminUsersComponent implements OnInit, OnDestroy {

  public users:          User[] = [];
  public  filteredUsers:  User[] = [];
   public paginatedUsers: User[] = [];

  public currentPage:  number  = 1;
  public itemsPerPage: number  = 5;
  public searchText:   string  = '';
  public isLoading:    boolean = false;

   public selectedUser:      User | null = null;
   public deleteConfirmUser: User | null = null;

  public successMessage: string  = '';
  public errorMessage:   string  = '';

  public showAddUserModal: boolean = false;
  public addUserLoading:   boolean = false;
  roles = ['AGENT', 'BUYER'];

  // ── REACTIVE FORM ──────────────────────────────────────────────────────────
  addUserForm!: FormGroup;

  editUser: editUser = { firstName: '', lastName: '', email: '', phone: '' };

  // ── SEARCH DEBOUNCE ────────────────────────────────────────────────────────
  private searchSubject$ = new Subject<string>();
  private destroy$       = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router:      Router,
    private cdr:         ChangeDetectorRef,
    private fb:          FormBuilder
  ) {}

  public ngOnInit(): void {
    const role = this.authService.getRole()?.trim().toUpperCase();
    if (role !== 'ADMIN') { this.router.navigate(['/login']); return; }

    this.buildAddUserForm();

    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(text => this.executeSearch(text));

    this.getAllUsers();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── BUILD FORM ─────────────────────────────────────────────────────────────
  private buildAddUserForm(): void {
    this.addUserForm = this.fb.group(
      {
        firstName:       ['', [Validators.required, Validators.minLength(2)]],
        lastName:        ['', [Validators.required, Validators.minLength(2)]],
        email:           ['', [Validators.required, Validators.email]],
        phone:           ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        role:            ['', Validators.required],
        password:        ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // ── CROSS-FIELD VALIDATOR ──────────────────────────────────────────────────
  private passwordMatchValidator(group: FormGroup): { passwordMismatch: true } | null {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  get f() { return this.addUserForm.controls; }

  // ── SEARCH ─────────────────────────────────────────────────────────────────
  public onSearchInput(value: string): void {
    if (value.length > 0 && value.length < 3) return;
    this.searchSubject$.next(value);
  }

  private executeSearch(text: string): void {
    const lower = text.toLowerCase().trim();
    this.filteredUsers = !lower
      ? [...this.users]
      : this.users.filter(u =>
          u.firstName?.toLowerCase().includes(lower) ||
          u.lastName?.toLowerCase().includes(lower)  ||
          u.email?.toLowerCase().includes(lower)     ||
          u.phone?.toLowerCase().includes(lower)
        );
    this.currentPage = 1;
    this.updatePaginatedUsers();
    this.cdr.detectChanges();
  }

  public applySearch(): void {
    this.searchSubject$.next(this.searchText);
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────
  public getAllUsers(): void {
    this.isLoading = true;
    const token = this.authService.getToken() || '';
    this.userService.getAllUsers(token).subscribe({
      next: (res: User[]) => {
        this.users         = Array.isArray(res) ? res : [];
        this.filteredUsers = [...this.users];
        this.currentPage   = 1;
        this.updatePaginatedUsers();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showError('Failed to load users.');
      }
    });
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────
  private updatePaginatedUsers(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  public nextPage(): void {
    if (this.currentPage < this.totalPages()) { this.currentPage++; this.updatePaginatedUsers(); }
  }

  public previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.updatePaginatedUsers(); }
  }

  public totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  // ── EDIT ───────────────────────────────────────────────────────────────────
  public openEdit(user: User): void {
    this.selectedUser = user;
    this.editUser = {
      firstName: user.firstName, lastName: user.lastName,
      email: user.email, phone: user.phone ?? ''
    };
  }

  public updateUser(): void {
    if (!this.selectedUser) return;
    const token = this.authService.getToken() || '';
    this.userService.updateUser(this.selectedUser.id, this.editUser, token).subscribe({
      next: (res: User) => {
        this.selectedUser = null;
        this.showSuccess('User updated successfully!');
        setTimeout(() => this.getAllUsers(), 300);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.showError(err.error?.message || 'Failed to update user.');
        this.cdr.detectChanges();
      }
    });
  }

  public closeModal(): void { this.selectedUser = null; }

  // ── ADD USER ───────────────────────────────────────────────────────────────
  public openAddUserModal(): void {
    this.buildAddUserForm();
    this.showAddUserModal = true;
  }

  public closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.addUserForm.reset();
  }

  public submitAddUser(): void {
    this.addUserForm.markAllAsTouched();
    if (this.addUserForm.invalid) return;

    const d = this.addUserForm.value;
    this.addUserLoading = true;

    this.authService.register({
      firstName: d.firstName.trim(),
      lastName:  d.lastName.trim(),
      email:     d.email.trim(),
      password:  d.password,
      phone:     d.phone.trim(),
      role:      d.role
    }).subscribe({
      next: () => {
        this.addUserLoading   = false;
        this.showAddUserModal = false;
        this.addUserForm.reset();
        this.getAllUsers();
        this.showSuccess('User registered successfully!');
      },
      error: (err: HttpErrorResponse) => {
        this.addUserLoading = false;
        this.showError(err.error?.message || 'Registration failed!');
      }
    });
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  public confirmDelete(user: User): void { this.deleteConfirmUser = user; }

  public deleteUser(): void {
    if (!this.deleteConfirmUser) return;

    const id    = this.deleteConfirmUser.id;
    const token = this.authService.getToken() || '';
    this.deleteConfirmUser = null;

    this.userService.deleteUser(id, token).subscribe({
      next: () => {
        this.getAllUsers();
        this.showSuccess('User deleted successfully!');
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.showError(err.error?.message || 'Failed to delete user.');
      }
    });
  }

  public closeDeleteConfirm(): void { this.deleteConfirmUser = null; }

  // ── DISPLAY HELPERS ────────────────────────────────────────────────────────
  public getRoleDisplay(user: User): string {
    if (user.roleName) {
      const r = user.roleName.toUpperCase();
      return r === 'ADMIN' ? 'Admin' : r === 'AGENT' ? 'Agent' : r === 'BUYER' ? 'Buyer' : user.roleName;
    }
    const map: Record<number, string> = { 1: 'Admin', 2: 'Agent', 3: 'Buyer' };
    return user.roleId != null ? map[user.roleId] ?? 'Unknown' : 'Unknown';
  }

  public getRoleBadgeClass(user: User): string {
    const roleFromName = (user.roleName || '').toUpperCase();
    const roleFromId: Record<number, string> = { 1: 'ADMIN', 2: 'AGENT', 3: 'BUYER' };
    const role = roleFromName || (user.roleId != null ? roleFromId[user.roleId] : '') || '';
    if (role === 'ADMIN') return 'badge-admin';
    if (role === 'AGENT') return 'badge-agent';
    if (role === 'BUYER') return 'badge-buyer';
    return 'badge-default';
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