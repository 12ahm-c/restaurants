"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const Settings_1 = require("../models/Settings");
const logger_1 = require("../utils/logger");
class EmailService {
    static transporter = null;
    static async getTransporter() {
        if (this.transporter)
            return this.transporter;
        const settings = await Settings_1.Settings.getSingleton();
        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
            logger_1.logger.warn('SMTP not configured');
            return null;
        }
        this.transporter = nodemailer_1.default.createTransport({
            host: settings.smtp_host,
            port: settings.smtp_port || 587,
            secure: (settings.smtp_port || 587) === 465,
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_pass,
            },
        });
        return this.transporter;
    }
    static async sendEmail(to, subject, html) {
        const transporter = await this.getTransporter();
        if (!transporter)
            return false;
        try {
            await transporter.sendMail({
                from: `"RestoManager" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
            });
            logger_1.logger.info({ to, subject }, 'Email sent');
            return true;
        }
        catch (error) {
            logger_1.logger.error({ err: error, to, subject }, 'Failed to send email');
            return false;
        }
    }
    static async sendLoyaltyEarnedEmail(to, customerName, points, totalPoints) {
        const subject = 'Loyalty Points Earned';
        const html = `
      <h2>Loyalty Points Earned!</h2>
      <p>Hi ${customerName},</p>
      <p>You earned <strong>${points}</strong> loyalty points.</p>
      <p>Your total points: <strong>${totalPoints}</strong></p>
      <p>Thank you for your purchase!</p>
    `;
        return this.sendEmail(to, subject, html);
    }
    static async sendPaymentReceipt(to, orderId, amount, method) {
        const subject = 'Payment Receipt';
        const html = `
      <h2>Payment Receipt</h2>
      <p>Order ID: ${orderId}</p>
      <p>Amount: ${amount} MRU</p>
      <p>Payment Method: ${method}</p>
      <p>Thank you for your payment!</p>
    `;
        return this.sendEmail(to, subject, html);
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=email.service.js.map