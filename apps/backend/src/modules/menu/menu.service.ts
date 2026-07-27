import { Product, IProduct, ProductStatus } from '../../models/Product';
import { Category, ICategory } from '../../models/Category';
import { Inventory } from '../../models/Inventory';
import { AppError } from '../../utils/response';

export class MenuService {
  static async getProducts(filters: {
    categoryId?: string;
    status?: ProductStatus;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: IProduct[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'discontinued' };
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        (query.price as Record<string, unknown>).$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (query.price as Record<string, unknown>).$lte = filters.maxPrice;
      }
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const sortField = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return { products, total };
  }

  static async getProductById(id: string): Promise<{
    product: IProduct;
    recipe: Array<{ inventoryId: string; name: string; quantity: number; unit: string }>;
  }> {
    const product = await Product.findById(id).populate('categoryId', 'name');

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    const recipe = await Promise.all(
      (product.recipe || []).map(async (item) => {
        const inventory = await Inventory.findById(item.inventoryId);
        return {
          inventoryId: item.inventoryId.toString(),
          name: inventory?.name || 'Unknown',
          quantity: item.quantity,
          unit: inventory?.unit || 'unit',
        };
      })
    );

    return { product, recipe };
  }

  static async getCategories(): Promise<ICategory[]> {
    return Category.find().sort({ sortOrder: 1, name: 1 });
  }

  static async createCategory(data: {
    name: string;
    sortOrder?: number;
  }): Promise<ICategory> {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Category name already exists');
    }

    return Category.create(data);
  }

  static async updateCategory(
    id: string,
    data: Partial<{ name: string; sortOrder: number }>
  ): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found');
    }

    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({ name: data.name, _id: { $ne: id } });
      if (existing) {
        throw new AppError(409, 'DUPLICATE', 'Category name already exists');
      }
    }

    Object.assign(category, data);
    await category.save();

    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found');
    }

    const productsUsingCategory = await Product.countDocuments({ categoryId: id });
    if (productsUsingCategory > 0) {
      throw new AppError(
        409,
        'INVALID_STATE',
        `Cannot delete category with ${productsUsingCategory} products`
      );
    }

    await Category.findByIdAndDelete(id);
  }

  static async createProduct(data: {
    name: string;
    description?: string;
    categoryId: string;
    price: number;
    prepTime?: number;
    imageUrl?: string;
    recipe?: Array<{ inventoryId: string; quantity: number }>;
  }): Promise<IProduct> {
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found');
    }

    if (data.recipe && data.recipe.length > 0) {
      for (const item of data.recipe) {
        const inventory = await Inventory.findById(item.inventoryId);
        if (!inventory) {
          throw new AppError(
            404,
            'NOT_FOUND',
            `Inventory item ${item.inventoryId} not found`
          );
        }
        if (item.quantity <= 0) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            `Recipe quantity must be positive for ${inventory.name}`
          );
        }
      }
    }

    return Product.create(data);
  }

  static async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      categoryId: string;
      price: number;
      prepTime: number;
      status: ProductStatus;
      isActive: boolean;
      imageUrl: string;
      recipe: Array<{ inventoryId: string; quantity: number }>;
    }>
  ): Promise<IProduct> {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    if (data.categoryId) {
      const category = await Category.findById(data.categoryId);
      if (!category) {
        throw new AppError(404, 'NOT_FOUND', 'Category not found');
      }
    }

    if (data.recipe && data.recipe.length > 0) {
      for (const item of data.recipe) {
        const inventory = await Inventory.findById(item.inventoryId);
        if (!inventory) {
          throw new AppError(
            404,
            'NOT_FOUND',
            `Inventory item ${item.inventoryId} not found`
          );
        }
        if (item.quantity <= 0) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            `Recipe quantity must be positive for ${inventory.name}`
          );
        }
      }
    }

    Object.assign(product, data);
    await product.save();

    return product;
  }

  static async updateProductStatus(
    id: string,
    status: ProductStatus
  ): Promise<IProduct> {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    if (product.status === 'discontinued') {
      throw new AppError(
        409,
        'INVALID_STATE',
        'Cannot change status of discontinued product'
      );
    }

    product.status = status;
    product.isActive = status === 'available';
    await product.save();

    return product;
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    await Product.findByIdAndDelete(id);
  }

  static async getProductsAvailability(): Promise<
    Record<string, { inStock: boolean; missingItems: string[] }>
  > {
    const products = await Product.find({
      status: { $ne: 'discontinued' },
      recipe: { $exists: true, $ne: [] },
    }).populate('recipe.inventoryId', 'name quantity');

    const availability: Record<string, { inStock: boolean; missingItems: string[] }> = {};

    for (const product of products) {
      const missingItems: string[] = [];

      for (const recipeItem of product.recipe) {
        const inventory = recipeItem.inventoryId as unknown as {
          name: string;
          quantity: number;
        };
        if (inventory && inventory.quantity < recipeItem.quantity) {
          missingItems.push(inventory.name);
        }
      }

      availability[product._id.toString()] = {
        inStock: missingItems.length === 0,
        missingItems,
      };
    }

    return availability;
  }
}
