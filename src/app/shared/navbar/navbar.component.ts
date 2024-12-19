import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule, 
    MatButtonModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  isLoggedIn(): boolean {
    return !!this.authService.getLoggedInUser();
  }

  isAdmin(): boolean {
    const user = this.authService.getLoggedInUser();
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.authService.getLoggedInUser();
    return user?.role === 'user';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
