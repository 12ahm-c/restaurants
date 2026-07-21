import { Request, Response } from 'express';
export declare class MenuController {
    static getProducts(req: Request, res: Response): Promise<void>;
    static getProductById(req: Request, res: Response): Promise<void>;
    static getCategories(_req: Request, res: Response): Promise<void>;
    static createCategory(req: Request, res: Response): Promise<void>;
    static updateCategory(req: Request, res: Response): Promise<void>;
    static deleteCategory(req: Request, res: Response): Promise<void>;
    static createProduct(req: Request, res: Response): Promise<void>;
    static updateProduct(req: Request, res: Response): Promise<void>;
    static updateProductStatus(req: Request, res: Response): Promise<void>;
    static deleteProduct(req: Request, res: Response): Promise<void>;
    static getProductsAvailability(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=menu.controller.d.ts.map