import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleCount',
  standalone: false
})
export class RoleCountPipe implements PipeTransform {
  transform(users: any[], roleId: number): number {
    if (!users) return 0;
    return users.filter(u => u.roleId === roleId).length;
  }
}