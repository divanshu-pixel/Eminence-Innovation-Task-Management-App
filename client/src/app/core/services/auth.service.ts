import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse, User, UserRole } from '../models/user.model';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  username: string;
  role: UserRole;
  teamLead?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'task_app_token';
  private readonly userKey = 'task_app_user';
  private readonly userState = signal<User | null>(this.getStoredUser());

  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.token));

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((response) => {
        this.persistSession(response);
      })
    );
  }

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload).pipe(
      tap((response) => {
        this.persistSession(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userState.set(null);
    this.router.navigateByUrl('/login');
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.userState.set(response.user);
  }

  private getStoredUser(): User | null {
    const rawUser = localStorage.getItem(this.userKey);
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  }
}
