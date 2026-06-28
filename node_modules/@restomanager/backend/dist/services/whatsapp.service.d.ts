export declare class WhatsAppService {
    private static apiUrl;
    static getPhoneNumberId(): Promise<string | null>;
    static getToken(): Promise<string | null>;
    static sendWhatsAppMessage(phone: string, message: string): Promise<boolean>;
    static sendOrderReadyMessage(phone: string, tableNumber: number): Promise<boolean>;
    static sendPaymentConfirmation(phone: string, amount: number, method: string): Promise<boolean>;
}
//# sourceMappingURL=whatsapp.service.d.ts.map