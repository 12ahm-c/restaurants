import nodemailer from 'nodemailer';
import { Settings } from '../models/Settings';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter(): Promise<nodemailer.Transporter | null> {
    if (this.transporter) return this.transporter;

    const settings = await Settings.getSingleton();
    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
      logger.warn('SMTP not configured');
      return null;
    }

    this.transporter = nodemailer.createTransport({
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

  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const transporter = await this.getTransporter();
    if (!transporter) return false;

    try {
      await transporter.sendMail({
        from: `"RestoManager" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      logger.info({ to, subject }, 'Email sent');
      return true;
    } catch (error) {
      logger.error({ err: error, to, subject }, 'Failed to send email');
      return false;
    }
  }

  static async sendLoyaltyEarnedEmail(
    to: string,
    customerName: string,
    points: number,
    totalPoints: number
  ): Promise<boolean> {
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

  static async sendPaymentReceipt(
    to: string,
    orderId: string,
    amount: number,
    method: string
  ): Promise<boolean> {
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
