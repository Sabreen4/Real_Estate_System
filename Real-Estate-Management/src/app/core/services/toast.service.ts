import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastr: ToastrService) {}

  public success(message: string, title: string = 'Success'): void {

    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

 public  error(message: string, title: string = 'Error'): void {

    this.toastr.error(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

 public  warning(message: string, title: string = 'Warning'): void {

    this.toastr.warning(message, title);
  }

  public info(message: string, title: string = 'Info'): void {

    this.toastr.info(message, title);
  }
}