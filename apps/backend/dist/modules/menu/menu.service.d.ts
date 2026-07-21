import { IProduct, ProductStatus } from '../../models/Product';
import { ICategory } from '../../models/Category';
export declare class MenuService {
    static getProducts(filters: {
        categoryId?: string;
        status?: ProductStatus;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }): Promise<{
        products: IProduct[];
        total: number;
    }>;
    static getProductById(id: string): Promise<{
        product: IProduct;
        recipe: Array<{
            inventoryId: string;
            name: string;
            quantity: number;
            unit: string;
        }>;
    }>;
    static getCategories(): Promise<ICategory[]>;
    static createCategory(data: {
        name: string;
        sortOrder?: number;
    }): Promise<ICategory>;
    static updateCategory(id: string, data: Partial<{
        name: string;
        sortOrder: number;
    }>): Promise<ICategory>;
    static deleteCategory(id: string): Promise<void>;
    static createProduct(data: {
        name: string;
        description?: string;
        categoryId: string;
        price: number;
        prepTime?: number;
        imageUrl?: string;
        recipe?: Array<{
            inventoryId: string;
            quantity: number;
        }>;
    }): Promise<IProduct>;
    static updateProduct(id: string, data: Partial<{
        name: string;
        description: string;
        categoryId: string;
        price: number;
        prepTime: number;
        status: ProductStatus;
        isActive: boolean;
        imageUrl: string;
        recipe: Array<{
            inventoryId: string;
            quantity: number;
        }>;
    }>): Promise<IProduct>;
    static updateProductStatus(id: string, status: ProductStatus): Promise<IProduct>;
    static deleteProduct(id: string): Promise<void>;
    static getProductsAvailability(): Promise<Record<string, {
        inStock: boolean;
        missingItems: string[];
    }>>;
}
//# sourceMappingURL=menu.service.d.ts.map