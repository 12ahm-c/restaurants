import { UserRole } from '../types';

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'server':
      return '/tents';
    case 'chef':
    case 'stock_manager':
      return '/kitchen';
    case 'cashier':
      return '/dashboard';
    case 'owner':
    case 'manager':
    default:
      return '/dashboard';
  }
}
