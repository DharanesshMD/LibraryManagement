import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getLoggedInUser();

    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    
    const expectedRole = route.data['role'];
    if (user.role !== expectedRole) {
      alert('Access denied');
      return false;
    }

    return true; 
  }
}
