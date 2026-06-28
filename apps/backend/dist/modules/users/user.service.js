"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = require("../../models/User");
const Log_1 = require("../../models/Log");
const response_1 = require("../../utils/response");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_service_1 = require("../auth/auth.service");
class UserService {
    static async updateProfile(userId, input) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'User not found');
        }
        if (input.email && input.email !== user.email) {
            const existingUser = await User_1.User.findOne({ email: input.email, _id: { $ne: user._id } });
            if (existingUser) {
                throw new response_1.AppError(409, 'CONFLICT', 'Email already in use');
            }
        }
        if (input.name)
            user.name = input.name;
        if (input.email)
            user.email = input.email;
        if (input.language)
            user.language = input.language;
        await user.save();
        await Log_1.Log.createLog({
            userId: user._id,
            action: 'profile_updated',
            entity: 'User',
            entityId: user._id,
            details: { fields: Object.keys(input) },
        });
        return auth_service_1.AuthService.toUserDTO(user);
    }
    static async getEmployees(page = 1, limit = 20, filters = {}) {
        const query = {};
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters.role) {
            query.role = filters.role;
        }
        const total = await User_1.User.countDocuments(query);
        const skip = (page - 1) * limit;
        const employees = await User_1.User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return {
            employees: employees.map(auth_service_1.AuthService.toUserDTO),
            total,
        };
    }
    static async createEmployee(input, createdByUserId) {
        const existingUser = await User_1.User.findOne({ email: input.email });
        if (existingUser) {
            throw new response_1.AppError(409, 'CONFLICT', 'Email already in use');
        }
        const user = await User_1.User.create({
            name: input.name,
            email: input.email,
            passwordHash: input.password,
            role: input.role,
        });
        await Log_1.Log.createLog({
            userId: new mongoose_1.default.Types.ObjectId(createdByUserId),
            action: 'employee_created',
            entity: 'User',
            entityId: user._id,
            details: { name: user.name, email: user.email, role: user.role },
        });
        return auth_service_1.AuthService.toUserDTO(user);
    }
    static async updateEmployee(employeeId, input, updatedByUserId) {
        const user = await User_1.User.findById(employeeId);
        if (!user) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Employee not found');
        }
        if (input.email && input.email !== user.email) {
            const existingUser = await User_1.User.findOne({ email: input.email, _id: { $ne: user._id } });
            if (existingUser) {
                throw new response_1.AppError(409, 'CONFLICT', 'Email already in use');
            }
        }
        if (input.name)
            user.name = input.name;
        if (input.email)
            user.email = input.email;
        if (input.role)
            user.role = input.role;
        if (input.isActive !== undefined)
            user.isActive = input.isActive;
        if (input.password)
            user.passwordHash = input.password;
        await user.save();
        await Log_1.Log.createLog({
            userId: new mongoose_1.default.Types.ObjectId(updatedByUserId),
            action: 'employee_updated',
            entity: 'User',
            entityId: user._id,
            details: { fields: Object.keys(input) },
        });
        return auth_service_1.AuthService.toUserDTO(user);
    }
    static async getEmployeeById(employeeId) {
        const user = await User_1.User.findById(employeeId);
        if (!user) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Employee not found');
        }
        return auth_service_1.AuthService.toUserDTO(user);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map