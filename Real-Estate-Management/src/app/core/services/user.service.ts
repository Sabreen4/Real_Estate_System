import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';
import { editUser } from '../models/editUser.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  public getHeaders(token: string): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  public getAllUsers(token: string): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, this.getHeaders(token));
  }

  public getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  public updateUser(id: number, data: editUser, token: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data, this.getHeaders(token));
  }

  public updateProfile(userId: number, payload: editUser): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}`, payload);
  }

  public deleteUser(id: number, token: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders(token));
  }
}