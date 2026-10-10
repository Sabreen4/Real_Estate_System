import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: false,
  templateUrl:'./paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {
  @Input() currentPage = 1;
  @Input() totalPages  = 1;
  @Output() pageChange = new EventEmitter<number>();
}