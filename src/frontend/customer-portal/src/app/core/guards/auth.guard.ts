import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Check for required roles
          const requiredRoles = route.data['roles'] as string[] | undefined;
          
          if (requiredRoles && requiredRoles.length > 0) {
            const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
            
            if (!hasRequiredRole) {
              // Redirect to unauthorized page
              return this.router.createUrlTree(['/unauthorized']);
            }
          }
          
          return true;
        } else {
          // Store the attempted URL for redirecting after login
          sessionStorage.setItem('redirectUrl', state.url);
          
          // Redirect to login page
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}