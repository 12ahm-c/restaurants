"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const Settings_1 = require("../models/Settings");
const logger_1 = require("../utils/logger");
class WhatsAppService {
    static apiUrl = 'https://graph.facebook.com/v17.0';
    static async getPhoneNumberId() {
        const settings = await Settings_1.Settings.getSingleton();
        return settings.whatsapp_business_phone_id || null;
    }
    static async getToken() {
        const settings = await Settings_1.Settings.getSingleton();
        return settings.whatsapp_token || null;
    }
    static async sendWhatsAppMessage(phone, message) {
        const phoneNumberId = await this.getPhoneNumberId();
        const token = await this.getToken();
        if (!phoneNumberId || !token) {
            logger_1.logger.warn('WhatsApp Business not configured');
            return false;
        }
        try {
            const response = await fetch(`${this.apiUrl}/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'text',
                    text: { body: message },
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                logger_1.logger.error({ error }, 'WhatsApp API error');
                return false;
            }
            logger_1.logger.info({ phone }, 'WhatsApp message sent');
            return true;
        }
        catch (error) {
            logger_1.logger.error({ err: error, phone }, 'Failed to send WhatsApp message');
            return false;
        }
    }
    static async sendOrderReadyMessage(phone, tableNumber) {
        const message = `Your order for table ${tableNumber} is ready to serve! 🍽️`;
        return this.sendWhatsAppMessage(phone, message);
    }
    static async sendPaymentConfirmation(phone, amount, method) {
        const message = `Payment of ${amount} MRU received via ${method}. Thank you! 💰`;
        return this.sendWhatsAppMessage(phone, message);
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=whatsapp.service.js.map