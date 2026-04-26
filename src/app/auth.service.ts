import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';
  private currentUserKey = 'kanban_user';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?username=${username}&password=${password}`);
  }

  saveUser(user: User) {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const u = localStorage.getItem(this.currentUserKey);
    return u ? JSON.parse(u) : null;
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}