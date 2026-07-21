import mongoose from 'mongoose';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { Tent } from './models/Tent';
import { logger } from './utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resto_manager';

const categories = [
  { name: 'المشويات', sortOrder: 1 },
  { name: 'الأطباق الرئيسية', sortOrder: 2 },
  { name: 'المشروبات', sortOrder: 3 },
  { name: 'الحلويات', sortOrder: 4 },
];

const quantityTypes = {
  meat: [
    { name: 'kilo', label: 'كيلو', price: 0, unit: 'kg' },
    { name: 'quarter', label: 'ربع', price: 0, unit: 'quarter' },
    { name: 'rib', label: 'ريبل', price: 0, unit: 'rib' },
  ],
};

const products = [
  // المشويات
  {
    name: 'لحم غنم مشوي',
    description: 'لحم غنم طازج مشوي على الفحم',
    emoji: '🍖',
    price: 0,
    hasQuantityTypes: true,
    quantityTypes: [
      { name: 'kilo', label: 'كيلو', price: 8500, unit: 'kg' },
      { name: 'quarter', label: 'ربع', price: 2200, unit: 'quarter' },
      { name: 'rib', label: 'ريبل', price: 3500, unit: 'rib' },
    ],
    categoryName: 'المشويات',
  },
  {
    name: 'لحم إبل مشوي',
    description: 'لحم إبل طازج مشوي على الفحم',
    emoji: '🥩',
    price: 0,
    hasQuantityTypes: true,
    quantityTypes: [
      { name: 'kilo', label: 'كيلو', price: 12000, unit: 'kg' },
      { name: 'quarter', label: 'ربع', price: 3000, unit: 'quarter' },
    ],
    categoryName: 'المشويات',
  },
  {
    name: 'لحم بقر مشوي',
    description: 'لحم بقر طازج مشوي على الفحم',
    emoji: '🥩',
    price: 0,
    hasQuantityTypes: true,
    quantityTypes: [
      { name: 'kilo', label: 'كيلو', price: 7000, unit: 'kg' },
      { name: 'quarter', label: 'ربع', price: 1800, unit: 'quarter' },
    ],
    categoryName: 'المشويات',
  },
  {
    name: 'دجاج مشوي',
    description: 'دجاج كامل مشوي على الفحم',
    emoji: '🍗',
    price: 0,
    hasQuantityTypes: true,
    quantityTypes: [
      { name: 'kilo', label: 'كيلو', price: 3500, unit: 'kg' },
      { name: 'piece', label: 'حبة', price: 2500, unit: 'piece' },
    ],
    categoryName: 'المشويات',
  },
  {
    name: 'كبدة مشوية',
    description: 'كبدة طازجة مشوية مع البصل والتوابل',
    emoji: '🫀',
    price: 2000,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'المشويات',
  },
  {
    name: 'أسياخ لحم (كباب)',
    description: 'أسياخ لحم مفروم مع التوابل والبقدونس',
    emoji: '🍢',
    price: 0,
    hasQuantityTypes: true,
    quantityTypes: [
      { name: 'piece', label: 'سيخ', price: 500, unit: 'piece' },
      { name: 'plate', label: 'طبق (6 أسياخ)', price: 3000, unit: 'plate' },
    ],
    categoryName: 'المشويات',
  },
  // الأطباق الرئيسية
  {
    name: 'الأرز باللحم',
    description: 'أرز بسمتي مع لحم غنم مطهو مع الخضار والتوابل',
    emoji: '🍚',
    price: 4500,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'الأرز بالدجاج',
    description: 'أرز بسمتي مع دجاج مطهو مع الخضار والتوابل',
    emoji: '🍚',
    price: 3500,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'الأرز بالسمك',
    description: 'أرز بسمتي مع سمك مشوي أو مقلي',
    emoji: '🍚',
    price: 4000,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'الكسكس',
    description: 'كسكس تقليدي مع لحم وخضر',
    emoji: '🥘',
    price: 4000,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'المشوي مع الأرز',
    description: 'طبق مشويات متنوعة مع أرز بسمتي',
    emoji: '🍖',
    price: 6000,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'الطاجين',
    description: 'طاجين تقليدي مع لحم والخضار',
    emoji: '🫕',
    price: 4500,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
  {
    name: 'مكرونة',
    description: 'مكرونة مع صلصة اللحم',
    emoji: '🍝',
    price: 2500,
    hasQuantityTypes: false,
    quantityTypes: [],
    categoryName: 'الأطباق الرئيسية',
  },
];

const tents = [
  { tentNumber: 1, size: 'large' as const },
  { tentNumber: 2, size: 'large' as const },
  { tentNumber: 3, size: 'medium' as const },
  { tentNumber: 4, size: 'medium' as const },
  { tentNumber: 5, size: 'small' as const },
  { tentNumber: 6, size: 'small' as const },
  { tentNumber: 7, size: 'small' as const },
  { tentNumber: 8, size: 'small' as const },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Tent.deleteMany({});

    logger.info('Cleared existing data');

    // Create categories
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const cat of categories) {
      const created = await Category.create(cat);
      categoryMap[cat.name] = created._id;
      logger.info(`Created category: ${cat.name}`);
    }

    // Create products
    for (const prod of products) {
      const categoryId = categoryMap[prod.categoryName];
      if (!categoryId) {
        logger.warn(`Category not found: ${prod.categoryName}`);
        continue;
      }

      await Product.create({
        name: prod.name,
        description: prod.description,
        emoji: prod.emoji,
        categoryId,
        price: prod.price,
        hasQuantityTypes: prod.hasQuantityTypes,
        quantityTypes: prod.quantityTypes,
        status: 'available',
      });
      logger.info(`Created product: ${prod.name}`);
    }

    // Create tents
    for (const tent of tents) {
      await Tent.create({
        ...tent,
        position: { x: 0, y: 0 },
        status: 'free',
        isEmpty: true,
      });
      logger.info(`Created tent: #${tent.tentNumber} (${tent.size})`);
    }

    logger.info('Seed completed successfully!');
    logger.info(`Created ${categories.length} categories`);
    logger.info(`Created ${products.length} products`);
    logger.info(`Created ${tents.length} tents`);

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Seed failed');
    process.exit(1);
  }
}

seed();
