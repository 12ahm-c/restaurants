export type UserRole = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager';

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  branchId?: string;
  language: string;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  } | null;
  meta: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string;
    hasMore?: boolean;
  } | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {}

// Phase 2 Types

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'in-service';

export interface TableDTO {
  _id: string;
  name: string;
  branchId?: string;
  capacity: number;
  status: TableStatus;
  zone: string;
  position: { x: number; y: number };
  currentOrderId?: string;
  serverId?: string;
}

export interface TableStatusSummary {
  free: number;
  occupied: number;
  reserved: number;
  inService: number;
  total: number;
}

export type ProductStatus = 'available' | 'unavailable' | 'discontinued';

export interface ProductDTO {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  price: number;
  prepTime: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  _id: string;
  name: string;
  branchId?: string;
  sortOrder: number;
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'completed';

export interface OrderDTO {
  _id: string;
  branchId?: string;
  tableId: string;
  customerId?: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  totalHT: number;
  totalTTC: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDTO {
  _id: string;
  orderId: string;
  productId: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  options: Array<{ name: string; price: number }>;
  notes?: string;
  total: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  options?: Array<{ name: string; price: number }>;
  notes?: string;
}

export interface CreateOrderInput {
  tableId: string;
  customerId?: string;
  type: OrderType;
  paymentMethod?: 'cash' | 'card' | 'mobile';
  items: Array<{
    productId: string;
    quantity: number;
    variant?: string;
    options?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
  notes?: string;
}
