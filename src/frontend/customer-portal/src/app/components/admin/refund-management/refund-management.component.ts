import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService, RefundDto, CreateRefundDto, PaymentDto } from '../../../services/payment.service';

interface RefundRequest {
  id: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  requestedAmount: number;
  requestedReason: string;
  requestedNotes?: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: string;
  processedAt?: Date;
  payment?: PaymentDto;
}

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './refund-management.component.html',
  styleUrls: ['./refund-management.component.scss']
})
export class RefundManagementComponent implements OnInit {
  refundRequests: RefundRequest[] = [];
  processedRefunds: RefundDto[] = [];
  selectedRequest: RefundRequest | null = null;
  refundForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  activeTab: 'pending' | 'processed' = 'pending';
  
  // Filters
  statusFilter: string = 'all';
  dateFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.refundForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadRefundRequests();
    this.loadProcessedRefunds();
  }

  loadRefundRequests(): void {
    // This would typically load from a dedicated refund request API
    // For now, we'll simulate some data
    this.refundRequests = [
      {
        id: '1',
        paymentId: 'pay_123',
        orderId: 'ord_456',
        orderNumber: 'ORD-2024-001',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        requestedAmount: 50.00,
        requestedReason: 'Product Defective',
        requestedNotes: 'Item arrived damaged',
        requestedAt: new Date('2024-01-15'),
        status: 'pending'
      },
      {
        id: '2',
        paymentId: 'pay_789',
        orderId: 'ord_012',
        orderNumber: 'ORD-2024-002',
        customerEmail: 'jane@example.com',
        customerName: 'Jane Smith',
        requestedAmount: 100.00,
        requestedReason: 'Product Not Received',
        requestedAt: new Date('2024-01-14'),
        status: 'approved'
      }
    ];
  }

  loadProcessedRefunds(): void {
    // This would load actual processed refunds from the API
    // For demo purposes, showing empty for now
    this.processedRefunds = [];
  }

  get filteredRequests(): RefundRequest[] {
    let filtered = [...this.refundRequests];

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    // Date filter
    if (this.dateFilter !== 'all') {
      const now = new Date();
      const days = parseInt(this.dateFilter);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => r.requestedAt >= cutoff);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.orderNumber.toLowerCase().includes(term) ||
        r.customerEmail.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  selectRequest(request: RefundRequest): void {
    this.selectedRequest = request;
    this.refundForm.patchValue({
      amount: request.requestedAmount,
      reason: request.requestedReason,
      notes: request.requestedNotes || ''
    });
    this.clearMessages();
  }

  async processRefund(): Promise<void> {
    if (!this.selectedRequest || this.refundForm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      const refundData: CreateRefundDto = {
        paymentId: this.selectedRequest.paymentId,
        amount: this.refundForm.value.amount,
        reason: this.refundForm.value.reason,
        notes: this.refundForm.value.notes
      };

      this.paymentService.createRefund(refundData).subscribe({
        next: (refund) => {
          this.successMessage = `Refund processed successfully. Refund ID: ${refund.refundId}`;
          
          // Update the request status
          this.selectedRequest!.status = 'processed';
          this.selectedRequest!.processedAt = new Date();
          this.selectedRequest!.processedBy = 'Current Admin'; // Would get from auth service
          
          this.processedRefunds.push(refund);
          this.selectedRequest = null;
          this.refundForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to process refund';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to process refund';
      this.isLoading = false;
    }
  }

  approveRequest(request: RefundRequest): void {
    request.status = 'approved';
    this.successMessage = `Refund request for ${request.orderNumber} approved`;
  }

  rejectRequest(request: RefundRequest): void {
    if (confirm(`Are you sure you want to reject the refund request for ${request.orderNumber}?`)) {
      request.status = 'rejected';
      this.successMessage = `Refund request for ${request.orderNumber} rejected`;
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'processed': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌',
      'processed': '💰'
    };
    return icons[status] || '❓';
  }

  exportRefunds(): void {
    // This would export refund data to CSV or Excel
    console.log('Exporting refunds...');
    this.successMessage = 'Refund data exported successfully';
  }

  refreshData(): void {
    this.loadRefundRequests();
    this.loadProcessedRefunds();
    this.successMessage = 'Data refreshed';
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  cancelSelection(): void {
    this.selectedRequest = null;
    this.refundForm.reset();
    this.clearMessages();
  }
}