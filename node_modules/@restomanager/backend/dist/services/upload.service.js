"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImage = void 0;
exports.getImageUrl = getImageUrl;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const response_1 = require("../utils/response");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new response_1.AppError(400, 'VALIDATION_ERROR', 'Only JPG, PNG, and WebP images are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.uploadProductImage = upload.single('image');
function getImageUrl(filename) {
    return `/uploads/products/${filename}`;
}
//# sourceMappingURL=upload.service.js.map