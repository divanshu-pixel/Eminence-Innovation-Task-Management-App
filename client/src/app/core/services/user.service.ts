import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  listUsers() {
    return this.http.get<{ users: User[] }>(`${API_BASE_URL}/users`);
  }

  listTeamLeads() {
    return this.http.get<{ users: User[] }>(`${API_BASE_URL}/users/team-leads`);
  }
}
