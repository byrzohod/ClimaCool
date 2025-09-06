import { Component, signal } from '@angular/core';
import { SimpleLayoutComponent } from './simple-layout.component';

@Component({
  selector: 'app-root',
  imports: [SimpleLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('customer-portal');
}
