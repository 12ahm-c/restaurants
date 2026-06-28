import { IUser } from '../../models/User';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
}
export interface UserDTO {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    branchId?: string;
    language: string;
    lastLogin?: string;
    createdAt: string;
}
export declare class AuthService {
    static login(email: string, password: string, ip?: string, userAgent?: string): Promise<{
        user: UserDTO;
        tokens: TokenPair;
    }>;
    static refreshToken(refreshToken: string): Promise<TokenPair>;
    static logout(refreshToken: string): Promise<void>;
    static getMe(userId: string): Promise<UserDTO>;
    private static generateTokenPair;
    private static invalidateTokenFamily;
    static toUserDTO(user: IUser): UserDTO;
}
//# sourceMappingURL=auth.service.d.ts.map