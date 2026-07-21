"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
class ExportService {
    static async generatePDF(data, columns, title, restaurantName) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margin: 50,
                bufferPages: true,
                info: {
                    Title: title,
                    Author: restaurantName || 'RestoManager',
                    Subject: title,
                    CreationDate: new Date(),
                },
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const pageWidth = doc.page.width;
            const contentWidth = pageWidth - 100;
            // Header background
            doc.save();
            doc.rect(0, 0, pageWidth, 120).fill('#4F46E5');
            // Restaurant name
            doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold')
                .text(restaurantName || 'RestoManager', 50, 30, { width: contentWidth, align: 'center' });
            // Report title
            doc.fontSize(14).fillColor('#C7D2FE').font('Helvetica')
                .text(title, 50, 60, { width: contentWidth, align: 'center' });
            // Date range
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.fontSize(10).fillColor('#A5B4FC')
                .text(`Generated on ${dateStr}`, 50, 82, { width: contentWidth, align: 'center' });
            doc.restore();
            // Decorative line
            doc.moveTo(50, 130).lineTo(pageWidth - 50, 130).lineWidth(1).strokeColor('#E5E7EB').stroke();
            // Table
            const tableTop = 150;
            const cellPadding = 8;
            const rowHeight = 22;
            let currentY = tableTop;
            // Calculate column widths
            const totalWidth = columns.reduce((sum, col) => sum + (col.width || 80), 0);
            const scale = contentWidth / totalWidth;
            const colWidths = columns.map(col => (col.width || 80) * scale);
            // Table header background
            doc.rect(50, currentY, contentWidth, rowHeight + 4).fill('#F3F4F6');
            // Table header text
            doc.fontSize(8).fillColor('#6B7280').font('Helvetica-Bold');
            let currentX = 50;
            columns.forEach((col, i) => {
                doc.text(col.header.toUpperCase(), currentX + cellPadding, currentY + 6, {
                    width: colWidths[i] - cellPadding * 2,
                    align: i === 0 ? 'left' : 'right',
                });
                currentX += colWidths[i];
            });
            currentY += rowHeight + 4;
            // Table rows
            doc.font('Helvetica').fontSize(8);
            data.forEach((row, rowIndex) => {
                // Alternating row background
                if (rowIndex % 2 === 0) {
                    doc.rect(50, currentY, contentWidth, rowHeight).fill('#FFFFFF');
                }
                else {
                    doc.rect(50, currentY, contentWidth, rowHeight).fill('#F9FAFB');
                }
                doc.fillColor('#111827');
                let x = 50;
                columns.forEach((col, i) => {
                    const value = row[col.key] !== undefined ? String(row[col.key]) : '';
                    doc.text(value, x + cellPadding, currentY + 6, {
                        width: colWidths[i] - cellPadding * 2,
                        align: i === 0 ? 'left' : 'right',
                    });
                    x += colWidths[i];
                });
                currentY += rowHeight;
                // Page break
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }
            });
            // Table border
            doc.rect(50, tableTop, contentWidth, currentY - tableTop)
                .lineWidth(0.5).strokeColor('#D1D5DB').stroke();
            // Footer
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#9CA3AF').font('Helvetica')
                    .text(`${restaurantName || 'RestoManager'} | ${title} | Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, { width: contentWidth, align: 'center' });
            }
            doc.end();
        });
    }
    static async generateExcel(data, columns, title, restaurantName) {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = restaurantName || 'RestoManager';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(title.substring(0, 31));
        // Title row
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = restaurantName || 'RestoManager';
        titleCell.font = { bold: true, size: 16, color: { argb: '4F46E5' } };
        titleCell.alignment = { horizontal: 'center' };
        // Subtitle row
        worksheet.mergeCells('A2:F2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = title;
        subtitleCell.font = { bold: true, size: 12, color: { argb: '6B7280' } };
        subtitleCell.alignment = { horizontal: 'center' };
        // Empty row
        worksheet.addRow([]);
        // Header row
        const headerRow = worksheet.addRow(columns.map(col => col.header));
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
        headerRow.alignment = { horizontal: 'center' };
        // Data rows
        data.forEach((row, index) => {
            const dataRow = worksheet.addRow(columns.map(col => row[col.key]));
            if (index % 2 === 0) {
                dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
            }
        });
        // Auto-fit columns
        worksheet.columns.forEach((col) => {
            col.width = 18;
        });
        // Border
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'D1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
                    left: { style: 'thin', color: { argb: 'D1D5DB' } },
                    right: { style: 'thin', color: { argb: 'D1D5DB' } },
                };
            });
        });
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