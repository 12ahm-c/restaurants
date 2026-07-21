"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = connectMongoDB;
exports.disconnectMongoDB = disconnectMongoDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
async function connectMongoDB() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            });
            logger_1.logger.info('Connected to MongoDB');
            return;
        }
        catch (error) {
            if (attempt < MAX_RETRIES) {
                logger_1.logger.warn(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            }
            else {
                logger_1.logger.error({ err: error }, 'Failed to connect to MongoDB after all retries');
                process.exit(1);
            }
        }
    }
    mongoose_1.default.connection.on('error', (error) => {
        logger_1.logger.error('MongoDB connection error:', error);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        logger_1.logger.warn('MongoDB disconnected');
    });
    mongoose_1.default.connection.on('reconnected', () => {
        logger_1.logger.info('MongoDB reconnected');
    });
}
async function disconnectMongoDB() {
    await mongoose_1.default.disconnect();
    logger_1.logger.info('Disconnected from MongoDB');
}
//# sourceMappingURL=db.js.map