import { User, IUser, UserRole } from '../../models/User';
import { Log } from '../../models/Log';
import { AppError } from '../../utils/response';
import mongoose from 'mongoose';
import { AuthService } from '../auth/auth.service';

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  language?: string;
}

export interface CreateEmployeeInput {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface UpdateEmployeeInput {
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export class UserService {
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<ReturnType<typeof AuthService.toUserDTO>> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (input.phone && input.phone !== user.phone) {
      const existingUser = await User.findOne({ phone: input.phone, _id: { $ne: user._id } });
      if (existingUser) {
        throw new AppError(409, 'CONFLICT', 'Phone number already in use');
      }
    }

    if (input.name) user.name = input.name;
    if (input.phone) user.phone = input.phone;
    if (input.language) user.language = input.language;

    await user.save();

    await Log.createLog({
      userId: user._id,
      action: 'profile_updated',
      entity: 'User',
      entityId: user._id,
      details: { fields: Object.keys(input) },
    });

    return AuthService.toUserDTO(user);
  }

  static async getEmployees(
    page: number = 1,
    limit: number = 20,
    filters: { isActive?: boolean; role?: UserRole } = {}
  ): Promise<{ employees: ReturnType<typeof AuthService.toUserDTO>[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.role) {
      query.role = filters.role;
    }

    const total = await User.countDocuments(query);
    const skip = (page - 1) * limit;

    const employees = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      employees: employees.map(AuthService.toUserDTO),
      total,
    };
  }

  static async createEmployee(input: CreateEmployeeInput, createdByUserId: string): Promise<ReturnType<typeof AuthService.toUserDTO>> {
    const existingUser = await User.findOne({ phone: input.phone });

    if (existingUser) {
      throw new AppError(409, 'CONFLICT', 'Phone number already in use');
    }

    const user = await User.create({
      name: input.name,
      phone: input.phone,
      passwordHash: input.password,
      role: input.role,
    });

    await Log.createLog({
      userId: new mongoose.Types.ObjectId(createdByUserId),
      action: 'employee_created',
      entity: 'User',
      entityId: user._id,
      details: { name: user.name, phone: user.phone, role: user.role },
    });

    return AuthService.toUserDTO(user);
  }

  static async updateEmployee(
    employeeId: string,
    input: UpdateEmployeeInput,
    updatedByUserId: string
  ): Promise<ReturnType<typeof AuthService.toUserDTO>> {
    const user = await User.findById(employeeId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found');
    }

    if (input.phone && input.phone !== user.phone) {
      const existingUser = await User.findOne({ phone: input.phone, _id: { $ne: user._id } });
      if (existingUser) {
        throw new AppError(409, 'CONFLICT', 'Phone number already in use');
      }
    }

    if (input.name) user.name = input.name;
    if (input.phone) user.phone = input.phone;
    if (input.role) user.role = input.role;
    if (input.isActive !== undefined) user.isActive = input.isActive;
    if (input.password) user.passwordHash = input.password;

    await user.save();

    await Log.createLog({
      userId: new mongoose.Types.ObjectId(updatedByUserId),
      action: 'employee_updated',
      entity: 'User',
      entityId: user._id,
      details: { fields: Object.keys(input) },
    });

    return AuthService.toUserDTO(user);
  }

  static async getEmployeeById(employeeId: string): Promise<ReturnType<typeof AuthService.toUserDTO>> {
    const user = await User.findById(employeeId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found');
    }

    return AuthService.toUserDTO(user);
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Current password is incorrect');
    }

    user.passwordHash = newPassword;
    await user.save();
  }
}
