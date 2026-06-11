import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { ErrorBannerComponent } from '../../shared/components/error-banner.component';
import { User, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ErrorBannerComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './auth.css'
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly teamLeads = signal<User[]>([]);
  readonly teamLeadsLoaded = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Employee' as UserRole, Validators.required],
    teamLead: this.fb.control<string | null>(null)
  });

  ngOnInit(): void {
    this.loadTeamLeadsIfNeeded();

    this.form.controls.role.valueChanges.subscribe((role) => {
      if (role !== 'Employee') {
        this.form.controls.teamLead.setValue(null);
        return;
      }

      this.loadTeamLeadsIfNeeded();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (error) => {
        this.error.set(error.error?.message || 'Unable to create account.');
        this.loading.set(false);
      }
    });
  }

  private loadTeamLeadsIfNeeded(): void {
    if (this.form.controls.role.value !== 'Employee' || this.teamLeadsLoaded()) {
      return;
    }

    this.userService.listTeamLeads().subscribe({
      next: ({ users }) => {
        this.teamLeads.set(users);
        this.teamLeadsLoaded.set(true);
      },
      error: () => this.teamLeads.set([])
    });
  }
}
