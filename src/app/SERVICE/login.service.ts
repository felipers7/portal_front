import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  baseUrl: any = 'http://localhost:8080';

  constructor(private http: HttpClient){}

  login(username: string, password: string): Observable<any>{
    const body = { username, password };
    return this.http.post(`${this.baseUrl}/login`, body);
  };

}
