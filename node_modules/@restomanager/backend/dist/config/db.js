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
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.logger.info('Connected to MongoDB');
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to connect to MongoDB');
        process.exit(1);
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