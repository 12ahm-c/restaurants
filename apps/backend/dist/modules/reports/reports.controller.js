"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
const export_service_1 = require("../../services/export.service");
class ReportsController {
    static async getSalesReport(req, res) {
        try {
            const { from, to, format } = req.query;
            if (!from || !to) {
                res.status(400).json({ message: 'from and to query parameters are required' });
                return;
            }
            const report = await reports_service_1.ReportsService.getSalesReport(from, to);
            if (format === 'pdf') {
                const columns = [
                    { header: 'Date', key: 'date', width: 100 },
                    { header: 'Total Sales', key: 'totalSales', width: 100 },
                    { header: 'Orders', key: 'ordersCount', width: 60 },
                    { header: 'Cash', key: 'cashSales', width: 80 },
                    { header: 'Card', key: 'cardSales', width: 80 },
                    { header: 'Mobile', key: 'mobileSales', width: 80 },
                ];
                const pdf = await export_service_1.ExportService.generatePDF(report.sales, columns, `Sales Report ${from} to ${to}`);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${from}-${to}.pdf`);
                res.send(pdf);
            }
            else if (format === 'xlsx') {
                const columns = [
                    { header: 'Date', key: 'date' },
                    { header: 'Total Sales', key: 'totalSales' },
                    { header: 'Orders', key: 'ordersCount' },
                    { header: 'Cash', key: 'cashSales' },
                    { header: 'Card', key: 'cardSales' },
                    { header: 'Mobile', key: 'mobileSales' },
                ];
                const xlsx = await export_service_1.ExportService.generateExcel(report.sales, columns, `Sales Report`);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${from}-${to}.xlsx`);
                res.send(xlsx);
            }
            else {
                res.json(report);
            }
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get sales report' });
        }
    }
    static async getProfitabilityReport(req, res) {
        try {
            const { from, to, format } = req.query;
            if (!from || !to) {
                res.status(400).json({ message: 'from and to query parameters are required' });
                return;
            }
            const report = await reports_service_1.ReportsService.getProfitabilityReport(from, to);
            if (format === 'pdf') {
                const data = [
                    { metric: 'Revenue', value: report.revenue },
                    { metric: 'Expenses', value: report.expenses },
                    { metric: 'Profit', value: report.profit },
                    { metric: 'Margin (%)', value: report.margin },
                ];
                const columns = [
                    { header: 'Metric', key: 'metric', width: 150 },
                    { header: 'Value (MRU)', key: 'value', width: 120 },
                ];
                const pdf = await export_service_1.ExportService.generatePDF(data, columns, `Profitability Report ${from} to ${to}`);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=profitability-report-${from}-${to}.pdf`);
                res.send(pdf);
            }
            else if (format === 'xlsx') {
                const data = [
                    { metric: 'Revenue', value: report.revenue },
                    { metric: 'Expenses', value: report.expenses },
                    { metric: 'Profit', value: report.profit },
                    { metric: 'Margin (%)', value: report.margin },
                ];
                const columns = [
                    { header: 'Metric', key: 'metric' },
                    { header: 'Value (MRU)', key: 'value' },
                ];
                const xlsx = await export_service_1.ExportService.generateExcel(data, columns, `Profitability Report`);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=profitability-report-${from}-${to}.xlsx`);
                res.send(xlsx);
            }
            else {
                res.json(report);
            }
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get profitability report' });
        }
    }
    static async getStockUsageReport(req, res) {
        try {
            const { from, to, format } = req.query;
            if (!from || !to) {
                res.status(400).json({ message: 'from and to query parameters are required' });
                return;
            }
            const report = await reports_service_1.ReportsService.getStockUsageReport(from, to);
            if (format === 'pdf') {
                const columns = [
                    { header: 'Item', key: 'name', width: 150 },
                    { header: 'Consumed', key: 'consumed', width: 80 },
                    { header: 'Replenished', key: 'replenished', width: 80 },
                    { header: 'Waste', key: 'waste', width: 80 },
                ];
                const pdf = await export_service_1.ExportService.generatePDF(report.items, columns, `Stock Usage Report ${from} to ${to}`);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=stock-usage-report-${from}-${to}.pdf`);
                res.send(pdf);
            }
            else if (format === 'xlsx') {
                const columns = [
                    { header: 'Item', key: 'name' },
                    { header: 'Consumed', key: 'consumed' },
                    { header: 'Replenished', key: 'replenished' },
                    { header: 'Waste', key: 'waste' },
                ];
                const xlsx = await export_service_1.ExportService.generateExcel(report.items, columns, `Stock Usage Report`);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=stock-usage-report-${from}-${to}.xlsx`);
                res.send(xlsx);
            }
            else {
                res.json(report);
            }
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get stock usage report' });
        }
    }
}
exports.ReportsController = ReportsController;
//# sourceMappingURL=reports.controller.js.map