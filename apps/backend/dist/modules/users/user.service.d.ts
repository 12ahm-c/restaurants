import { UserRole } from '../../models/User';
import { AuthService } from '../auth/auth.service';
export interface UpdateProfileInput {
    name?: string;
    email?: string;
    language?: string;
}
export interface CreateEmployeeInput {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}
export interface UpdateEmployeeInput {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
}
export declare class UserService {
    static updateProfile(userId: string, input: UpdateProfileInput): Promise<ReturnType<typeof AuthService.toUserDTO>>;
    static getEmployees(page?: number, limit?: number, filters?: {
        isActive?: boolean;
        role?: UserRole;
    }): Promise<{
        employees: ReturnType<typeof AuthService.toUserDTO>[];
        total: number;
    }>;
    static createEmployee(input: CreateEmployeeInput, createdByUserId: string): Promise<ReturnType<typeof AuthService.toUserDTO>>;
    static updateEmployee(employeeId: string, input: UpdateEmployeeInput, updatedByUserId: string): Promise<ReturnType<typeof AuthService.toUserDTO>>;
    static getEmployeeById(employeeId: string): Promise<ReturnType<typeof AuthService.toUserDTO>>;
}
//# sourceMappingURL=user.service.d.ts.map