import { Component, Input } from '@angular/core';

export type BadgeType = 'role' | 'listing' | 'status';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css'],
  standalone:false
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() type: BadgeType = 'role';

  get cssClass(): string {
    if (this.type === 'role') {
      const map: Record<string, string> = {
        admin: 'badge-admin', agent: 'badge-agent', buyer: 'badge-buyer'
      };
      return map[this.label?.toLowerCase()] ?? 'badge-default';
    }
    if (this.type === 'listing') {
      const map: Record<string, string> = {
        sale: 'badge-sale', 'for sale': 'badge-sale',
        rent: 'badge-rent', 'for rent': 'badge-rent',
        lease: 'badge-lease'
      };
      return map[this.label?.toLowerCase()] ?? 'badge-default';
    }
    if (this.type === 'status') {
      const map: Record<string, string> = {
        active: 'status-active',
        available: 'status-active',
        sold: 'status-sold',
        pending: 'status-pending',
        rented: 'status-rented',
        inactive: 'status-inactive'
      };
      return map[this.label?.toLowerCase()] ?? 'badge-default';
    }
    return 'badge-default';
  }
}
