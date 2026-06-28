import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportService } from '../../services/export.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

function handleError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

export class ReportsController {
  static async getSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, format, restaurantName } = req.query;
      if (!from || !to) {
        sendError(res, 400, 'VALIDATION_ERROR', 'from and to query parameters are required');
        return;
      }

      const report = await ReportsService.getSalesReport(from as string, to as string);
      const name = (restaurantName as string) || 'RestoManager';

      if (format === 'pdf') {
        const columns = [
          { header: 'Date', key: 'date', width: 100 },
          { header: 'Total Sales', key: 'totalSales', width: 100 },
          { header: 'Orders', key: 'ordersCount', width: 60 },
          { header: 'Cash', key: 'cashSales', width: 80 },
          { header: 'Card', key: 'cardSales', width: 80 },
          { header: 'Mobile', key: 'mobileSales', width: 80 },
        ];
        const pdf = await ExportService.generatePDF(report.sales, columns, `Sales Report ${from} to ${to}`, name);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${from}-${to}.pdf`);
        res.send(pdf);
      } else if (format === 'xlsx') {
        const columns = [
          { header: 'Date', key: 'date' },
          { header: 'Total Sales', key: 'totalSales' },
          { header: 'Orders', key: 'ordersCount' },
          { header: 'Cash', key: 'cashSales' },
          { header: 'Card', key: 'cardSales' },
          { header: 'Mobile', key: 'mobileSales' },
        ];
        const xlsx = await ExportService.generateExcel(report.sales, columns, `Sales Report`, name);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${from}-${to}.xlsx`);
        res.send(xlsx);
      } else {
        sendSuccess(res, report);
      }
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getProfitabilityReport(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, format, restaurantName } = req.query;
      if (!from || !to) {
        sendError(res, 400, 'VALIDATION_ERROR', 'from and to query parameters are required');
        return;
      }

      const report = await ReportsService.getProfitabilityReport(from as string, to as string);
      const name = (restaurantName as string) || 'RestoManager';

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
        const pdf = await ExportService.generatePDF(data, columns, `Profitability Report ${from} to ${to}`, name);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=profitability-report-${from}-${to}.pdf`);
        res.send(pdf);
      } else if (format === 'xlsx') {
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
        const xlsx = await ExportService.generateExcel(data, columns, `Profitability Report`, name);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=profitability-report-${from}-${to}.xlsx`);
        res.send(xlsx);
      } else {
        sendSuccess(res, report);
      }
    } catch (error) {
      handleError(res, error);
    }
  }

  static async getStockUsageReport(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, format, restaurantName } = req.query;
      if (!from || !to) {
        sendError(res, 400, 'VALIDATION_ERROR', 'from and to query parameters are required');
        return;
      }

      const report = await ReportsService.getStockUsageReport(from as string, to as string);
      const name = (restaurantName as string) || 'RestoManager';

      if (format === 'pdf') {
        const columns = [
          { header: 'Item', key: 'name', width: 150 },
          { header: 'Consumed', key: 'consumed', width: 80 },
          { header: 'Replenished', key: 'replenished', width: 80 },
          { header: 'Waste', key: 'waste', width: 80 },
        ];
        const pdf = await ExportService.generatePDF(report.items, columns, `Stock Usage Report ${from} to ${to}`, name);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=stock-usage-report-${from}-${to}.pdf`);
        res.send(pdf);
      } else if (format === 'xlsx') {
        const columns = [
          { header: 'Item', key: 'name' },
          { header: 'Consumed', key: 'consumed' },
          { header: 'Replenished', key: 'replenished' },
          { header: 'Waste', key: 'waste' },
        ];
        const xlsx = await ExportService.generateExcel(report.items, columns, `Stock Usage Report`, name);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=stock-usage-report-${from}-${to}.xlsx`);
        res.send(xlsx);
      } else {
        sendSuccess(res, report);
      }
    } catch (error) {
      handleError(res, error);
    }
  }
}
