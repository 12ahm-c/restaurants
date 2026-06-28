"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const Product_1 = require("../../models/Product");
const Category_1 = require("../../models/Category");
const Inventory_1 = require("../../models/Inventory");
const response_1 = require("../../utils/response");
class MenuService {
    static async getProducts(filters) {
        const query = {};
        if (filters.categoryId) {
            query.categoryId = filters.categoryId;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        else {
            query.status = { $ne: 'discontinued' };
        }
        if (filters.search) {
            query.$text = { $search: filters.search };
        }
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.price = {};
            if (filters.minPrice !== undefined) {
                query.price.$gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                query.price.$lte = filters.maxPrice;
            }
        }
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;
        const sortField = filters.sortBy || 'name';
        const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
        const total = await Product_1.Product.countDocuments(query);
        const products = await Product_1.Product.find(query)
            .populate('categoryId', 'name')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { products, total };
    }
    static async getProductById(id) {
        const product = await Product_1.Product.findById(id).populate('categoryId', 'name');
        if (!product) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Product not found');
        }
        const recipe = await Promise.all((product.recipe || []).map(async (item) => {
            const inventory = await Inventory_1.Inventory.findById(item.inventoryId);
            return {
                inventoryId: item.inventoryId.toString(),
                name: inventory?.name || 'Unknown',
                quantity: item.quantity,
                unit: inventory?.unit || 'unit',
            };
        }));
        return { product, recipe };
    }
    static async getCategories() {
        return Category_1.Category.find().sort({ sortOrder: 1, name: 1 });
    }
    static async createCategory(data) {
        const existing = await Category_1.Category.findOne({ name: data.name });
        if (existing) {
            throw new response_1.AppError(409, 'DUPLICATE', 'Category name already exists');
        }
        return Category_1.Category.create(data);
    }
    static async updateCategory(id, data) {
        const category = await Category_1.Category.findById(id);
        if (!category) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Category not found');
        }
        if (data.name && data.name !== category.name) {
            const existing = await Category_1.Category.findOne({ name: data.name, _id: { $ne: id } });
            if (existing) {
                throw new response_1.AppError(409, 'DUPLICATE', 'Category name already exists');
            }
        }
        Object.assign(category, data);
        await category.save();
        return category;
    }
    static async deleteCategory(id) {
        const category = await Category_1.Category.findById(id);
        if (!category) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Category not found');
        }
        const productsUsingCategory = await Product_1.Product.countDocuments({ categoryId: id });
        if (productsUsingCategory > 0) {
            throw new response_1.AppError(409, 'INVALID_STATE', `Cannot delete category with ${productsUsingCategory} products`);
        }
        await Category_1.Category.findByIdAndDelete(id);
    }
    static async createProduct(data) {
        const category = await Category_1.Category.findById(data.categoryId);
        if (!category) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Category not found');
        }
        if (data.recipe && data.recipe.length > 0) {
            for (const item of data.recipe) {
                const inventory = await Inventory_1.Inventory.findById(item.inventoryId);
                if (!inventory) {
                    throw new response_1.AppError(404, 'NOT_FOUND', `Inventory item ${item.inventoryId} not found`);
                }
                if (item.quantity <= 0) {
                    throw new response_1.AppError(400, 'VALIDATION_ERROR', `Recipe quantity must be positive for ${inventory.name}`);
                }
            }
        }
        return Product_1.Product.create(data);
    }
    static async updateProduct(id, data) {
        const product = await Product_1.Product.findById(id);
        if (!product) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Product not found');
        }
        if (data.categoryId) {
            const category = await Category_1.Category.findById(data.categoryId);
            if (!category) {
                throw new response_1.AppError(404, 'NOT_FOUND', 'Category not found');
            }
        }
        if (data.recipe && data.recipe.length > 0) {
            for (const item of data.recipe) {
                const inventory = await Inventory_1.Inventory.findById(item.inventoryId);
                if (!inventory) {
                    throw new response_1.AppError(404, 'NOT_FOUND', `Inventory item ${item.inventoryId} not found`);
                }
                if (item.quantity <= 0) {
                    throw new response_1.AppError(400, 'VALIDATION_ERROR', `Recipe quantity must be positive for ${inventory.name}`);
                }
            }
        }
        Object.assign(product, data);
        await product.save();
        return product;
    }
    static async updateProductStatus(id, status) {
        const product = await Product_1.Product.findById(id);
        if (!product) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Product not found');
        }
        if (product.status === 'discontinued') {
            throw new response_1.AppError(409, 'INVALID_STATE', 'Cannot change status of discontinued product');
        }
        product.status = status;
        await product.save();
        return product;
    }
    static async deleteProduct(id) {
        const product = await Product_1.Product.findById(id);
        if (!product) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'Product not found');
        }
        product.status = 'discontinued';
        await product.save();
    }
}
exports.MenuService = MenuService;
//# sourceMappingURL=menu.service.js.map