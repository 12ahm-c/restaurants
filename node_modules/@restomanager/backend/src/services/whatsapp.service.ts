import { Settings } from '../models/Settings';
import { logger } from '../utils/logger';

export class WhatsAppService {
  private static apiUrl = 'https://graph.facebook.com/v17.0';

  static async getPhoneNumberId(): Promise<string | null> {
    const settings = await Settings.getSingleton();
    return settings.whatsapp_business_phone_id || null;
  }

  static async getToken(): Promise<string | null> {
    const settings = await Settings.getSingleton();
    return settings.whatsapp_token || null;
  }

  static async sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    const phoneNumberId = await this.getPhoneNumberId();
    const token = await this.getToken();

    if (!phoneNumberId || !token) {
      logger.warn('WhatsApp Business not configured');
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/${phoneNumberId}/messages`,
        {
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
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error }, 'WhatsApp API error');
        return false;
      }

      logger.info({ phone }, 'WhatsApp message sent');
      return true;
    } catch (error) {
      logger.error({ err: error, phone }, 'Failed to send WhatsApp message');
      return false;
    }
  }

  static async sendOrderReadyMessage(phone: string, tableNumber: number): Promise<boolean> {
    const message = `Your order for table ${tableNumber} is ready to serve! 🍽️`;
    return this.sendWhatsAppMessage(phone, message);
  }

  static async sendPaymentConfirmation(phone: string, amount: number, method: string): Promise<boolean> {
    const message = `Payment of ${amount} MRU received via ${method}. Thank you! 💰`;
    return this.sendWhatsAppMessage(phone, message);
  }
}
