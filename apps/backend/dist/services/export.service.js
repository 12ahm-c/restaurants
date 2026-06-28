"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
class ExportService {
    static async generatePDF(data, columns, title) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();
            const tableTop = doc.y;
            const cellPadding = 5;
            let currentY = tableTop;
            doc.fontSize(10).font('Helvetica-Bold');
            let currentX = 50;
            columns.forEach((col) => {
                doc.text(col.header, currentX, currentY, { width: col.width || 100 });
                currentX += (col.width || 100) + cellPadding;
            });
            doc.font('Helvetica').fontSize(9);
            currentY += 20;
            data.forEach((row) => {
                currentX = 50;
                columns.forEach((col) => {
                    const value = row[col.key] !== undefined ? String(row[col.key]) : '';
                    doc.text(value, currentX, currentY, { width: col.width || 100 });
                    currentX += (col.width || 100) + cellPadding;
                });
                currentY += 15;
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }
            });
            doc.end();
        });
    }
    static async generateExcel(data, columns, title) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet(title.substring(0, 31));
        worksheet.columns = columns.map((col) => ({
            header: col.header,
            key: col.key,
            width: 20,
        }));
        worksheet.getRow(1).font = { bold: true };
        worksheet.addRow(data);
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    static async generateCSV(data, columns) {
        const headers = columns.map((col) => col.header).join(',');
        const rows = data.map((row) => columns.map((col) => {
            const value = row[col.key] !== undefined ? String(row[col.key]) : '';
            return value.includes(',') ? `"${value}"` : value;
        }).join(','));
        return [headers, ...rows].join('\n');
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=export.service.js.map