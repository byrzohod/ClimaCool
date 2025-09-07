import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address, AddressType } from '../models/checkout.models';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ title }}</h3>
      
      <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Name Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              formControlName="firstName"
              data-testid="checkout-first-name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('firstName')?.invalid && addressForm.get('firstName')?.touched">
            <div *ngIf="addressForm.get('firstName')?.invalid && addressForm.get('firstName')?.touched" 
                 class="mt-1 text-sm text-red-600">
              First name is required
            </div>
          </div>
          
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              formControlName="lastName"
              data-testid="checkout-last-name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('lastName')?.invalid && addressForm.get('lastName')?.touched">
            <div *ngIf="addressForm.get('lastName')?.invalid && addressForm.get('lastName')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Last name is required
            </div>
          </div>
        </div>

        <!-- Company Field -->
        <div>
          <label for="company" class="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            id="company"
            formControlName="company"
            data-testid="checkout-company"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
        </div>

        <!-- Address Fields -->
        <div>
          <label for="addressLine1" class="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            id="addressLine1"
            formControlName="addressLine1"
            data-testid="checkout-address-line1"
            placeholder="Street address"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            [class.border-red-500]="addressForm.get('addressLine1')?.invalid && addressForm.get('addressLine1')?.touched">
          <div *ngIf="addressForm.get('addressLine1')?.invalid && addressForm.get('addressLine1')?.touched" 
               class="mt-1 text-sm text-red-600">
            Address is required
          </div>
        </div>

        <div>
          <label for="addressLine2" class="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            id="addressLine2"
            formControlName="addressLine2"
            data-testid="checkout-address-line2"
            placeholder="Apartment, suite, etc."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
        </div>

        <!-- City, State, Postal Code -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              formControlName="city"
              data-testid="checkout-city"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('city')?.invalid && addressForm.get('city')?.touched">
            <div *ngIf="addressForm.get('city')?.invalid && addressForm.get('city')?.touched" 
                 class="mt-1 text-sm text-red-600">
              City is required
            </div>
          </div>
          
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              formControlName="state"
              data-testid="checkout-state"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('state')?.invalid && addressForm.get('state')?.touched">
            <div *ngIf="addressForm.get('state')?.invalid && addressForm.get('state')?.touched" 
                 class="mt-1 text-sm text-red-600">
              State is required
            </div>
          </div>
          
          <div>
            <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              id="postalCode"
              formControlName="postalCode"
              data-testid="checkout-postal-code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('postalCode')?.invalid && addressForm.get('postalCode')?.touched">
            <div *ngIf="addressForm.get('postalCode')?.invalid && addressForm.get('postalCode')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Postal code is required
            </div>
          </div>
        </div>

        <!-- Country and Phone -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              id="country"
              formControlName="country"
              data-testid="checkout-country"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="addressForm.get('country')?.invalid && addressForm.get('country')?.touched">
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
            </select>
            <div *ngIf="addressForm.get('country')?.invalid && addressForm.get('country')?.touched" 
                 class="mt-1 text-sm text-red-600">
              Country is required
            </div>
          </div>
          
          <div>
            <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              formControlName="phoneNumber"
              data-testid="checkout-phone"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          </div>
        </div>

        <!-- Save as Default -->
        <div class="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            formControlName="isDefault"
            data-testid="checkout-set-default"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          <label for="isDefault" class="ml-2 block text-sm text-gray-700">
            Save as default address
          </label>
        </div>
      </form>
    </div>
  `
})
export class AddressFormComponent implements OnInit {
  @Input() title = 'Address Information';
  @Input() address?: Address;
  @Input() addressType: AddressType = AddressType.Shipping;
  @Output() addressChange = new EventEmitter<Address>();
  @Output() validChange = new EventEmitter<boolean>();

  addressForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    
    // Watch for form changes and emit validity
    this.addressForm.statusChanges.subscribe(status => {
      this.validChange.emit(status === 'VALID');
    });

    // Watch for form value changes and emit address
    this.addressForm.valueChanges.subscribe(value => {
      if (this.addressForm.valid) {
        this.addressChange.emit({
          ...value,
          type: this.addressType
        });
      }
    });
  }

  private initForm(): void {
    this.addressForm = this.fb.group({
      firstName: [this.address?.firstName || '', [Validators.required]],
      lastName: [this.address?.lastName || '', [Validators.required]],
      company: [this.address?.company || ''],
      addressLine1: [this.address?.addressLine1 || '', [Validators.required]],
      addressLine2: [this.address?.addressLine2 || ''],
      city: [this.address?.city || '', [Validators.required]],
      state: [this.address?.state || '', [Validators.required]],
      postalCode: [this.address?.postalCode || '', [Validators.required]],
      country: [this.address?.country || 'US', [Validators.required]],
      phoneNumber: [this.address?.phoneNumber || ''],
      isDefault: [this.address?.isDefault || false]
    });
  }

  onSubmit(): void {
    if (this.addressForm.valid) {
      this.addressChange.emit({
        ...this.addressForm.value,
        type: this.addressType
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.addressForm.controls).forEach(key => {
        this.addressForm.get(key)?.markAsTouched();
      });
    }
  }
}