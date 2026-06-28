export declare class EmailService {
    private static transporter;
    private static getTransporter;
    static sendEmail(to: string, subject: string, html: string): Promise<boolean>;
    static sendLoyaltyEarnedEmail(to: string, customerName: string, points: number, totalPoints: number): Promise<boolean>;
    static sendPaymentReceipt(to: string, orderId: string, amount: number, method: string): Promise<boolean>;
}
//# sourceMappingURL=email.service.d.ts.map