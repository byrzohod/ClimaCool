import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/models/auth.model';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  loading = true;
  success = false;
  error: string | null = null;
  token: string = '';
  resendLoading = false;
  resendSuccess = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get token from query params and verify email
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.token = params['token'] || '';
        if (this.token) {
          this.verifyEmail();
        } else {
          this.loading = false;
          this.error = 'Invalid or missing verification token.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyEmail(): void {
    this.loading = true;
    this.error = null;
    this.success = false;

    this.authService.verifyEmail(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          
          // Redirect to login or dashboard after 5 seconds
          setTimeout(() => {
            if (this.authService.isAuthenticated()) {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/auth/login']);
            }
          }, 5000);
        },
        error: (error: ApiError) => {
          this.loading = false;
          this.error = error.message || 'Failed to verify email. The token may be invalid or expired.';
        }
      });
  }

  resendVerificationEmail(): void {
    this.resendLoading = true;
    this.resendSuccess = false;
    this.error = null;

    this.authService.resendVerificationEmail()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resendLoading = false;
          this.resendSuccess = true;
        },
        error: (error: ApiError) => {
          this.resendLoading = false;
          this.error = error.message || 'Failed to resend verification email. Please try again.';
        }
      });
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}