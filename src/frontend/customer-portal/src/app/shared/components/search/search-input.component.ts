import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full">
      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (input)="onSearchInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.enter)="onSearch()"
          (keydown.arrowdown)="navigateSuggestions(1)"
          (keydown.arrowup)="navigateSuggestions(-1)"
          (keydown.escape)="hideSuggestions()"
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          [placeholder]="placeholder"
        >
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          *ngIf="searchTerm"
          (click)="clearSearch()"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Suggestions Dropdown -->
      <div
        *ngIf="showSuggestions && suggestions.length > 0"
        class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto"
      >
        <div
          *ngFor="let suggestion of suggestions; let i = index; trackBy: trackBySuggestion"
          (click)="selectSuggestion(suggestion)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
          [class.bg-gray-100]="i === selectedSuggestionIndex"
        >
          <div class="flex items-center">
            <svg class="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-gray-700">{{ suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        *ngIf="isLoading"
        class="absolute right-2 top-1/2 transform -translate-y-1/2"
      >
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    </div>
  `
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search products...';
  @Input() initialValue = '';
  @Output() searchChanged = new EventEmitter<string>();

  searchTerm = '';
  suggestions: string[] = [];
  showSuggestions = false;
  selectedSuggestionIndex = -1;
  isLoading = false;

  private searchSubject = new Subject<string>();
  private subscription = new Subscription();

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.searchTerm = this.initialValue;

    // Set up debounced search for suggestions
    this.subscription.add(
      this.searchSubject
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(term => term.trim().length > 1),
          switchMap(term => {
            this.isLoading = true;
            return this.productService.getSearchSuggestions(term);
          })
        )
        .subscribe({
          next: (result) => {
            this.suggestions = result.suggestions;
            this.showSuggestions = true;
            this.selectedSuggestionIndex = -1;
            this.isLoading = false;
          },
          error: () => {
            this.suggestions = [];
            this.showSuggestions = false;
            this.isLoading = false;
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    
    if (this.searchTerm.trim().length > 1) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
      this.isLoading = false;
    }
  }

  onFocus() {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur() {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 150);
  }

  onSearch() {
    if (this.selectedSuggestionIndex >= 0) {
      this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
    } else {
      this.hideSuggestions();
      this.searchChanged.emit(this.searchTerm);
    }
  }

  selectSuggestion(suggestion: string) {
    this.searchTerm = suggestion;
    this.hideSuggestions();
    this.searchChanged.emit(suggestion);
  }

  clearSearch() {
    this.searchTerm = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.searchChanged.emit('');
  }

  hideSuggestions() {
    this.showSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  navigateSuggestions(direction: number) {
    if (!this.showSuggestions || this.suggestions.length === 0) {
      return;
    }

    this.selectedSuggestionIndex += direction;
    
    if (this.selectedSuggestionIndex < 0) {
      this.selectedSuggestionIndex = this.suggestions.length - 1;
    } else if (this.selectedSuggestionIndex >= this.suggestions.length) {
      this.selectedSuggestionIndex = 0;
    }
  }

  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }
}