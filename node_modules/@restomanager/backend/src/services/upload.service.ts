import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/response';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'VALIDATION_ERROR', 'Only JPG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadProductImage = upload.single('image');

export function getImageUrl(filename: string): string {
  return `/uploads/products/${filename}`;
}
