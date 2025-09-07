import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-steps',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <nav aria-label="Progress">
        <ol role="list" class="flex items-center justify-center space-x-5">
          <li *ngFor="let step of steps; let i = index" class="relative">
            <!-- Completed Step -->
            <div *ngIf="currentStep > i + 1" 
                 class="flex items-center"
                 [attr.data-testid]="'checkout-step-' + (i + 1) + '-completed'">
              <div class="relative flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="ml-3 text-sm font-medium text-blue-600">{{ step }}</span>
            </div>

            <!-- Current Step -->
            <div *ngIf="currentStep === i + 1" 
                 class="flex items-center"
                 [attr.data-testid]="'checkout-step-' + (i + 1) + '-current'">
              <div class="relative flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span class="text-white text-sm font-medium">{{ i + 1 }}</span>
              </div>
              <span class="ml-3 text-sm font-medium text-blue-600">{{ step }}</span>
            </div>

            <!-- Upcoming Step -->
            <div *ngIf="currentStep < i + 1" 
                 class="flex items-center"
                 [attr.data-testid]="'checkout-step-' + (i + 1) + '-upcoming'">
              <div class="relative flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                <span class="text-gray-500 text-sm font-medium">{{ i + 1 }}</span>
              </div>
              <span class="ml-3 text-sm font-medium text-gray-500">{{ step }}</span>
            </div>

            <!-- Step Separator -->
            <div *ngIf="i < steps.length - 1" class="absolute top-4 left-full w-5 -ml-px">
              <div class="w-full h-0.5 bg-gray-200"
                   [class.bg-blue-600]="currentStep > i + 1">
              </div>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  `
})
export class CheckoutStepsComponent {
  @Input() currentStep: number = 1;
  @Input() steps: string[] = ['Shipping', 'Review', 'Confirmation'];
  @Output() stepClick = new EventEmitter<number>();

  onStepClick(step: number): void {
    this.stepClick.emit(step);
  }
}