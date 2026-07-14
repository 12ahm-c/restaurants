import { useState, useEffect } from 'react';
import { reportsService, SalesReport, ProfitabilityReport, StockUsageReport } from '../../services/reports.service';
import { useI18n } from '../../i18n/I18nContext';
import { apiClient } from '../../services/api-client';

export function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'profitability' | 'stock-usage'>('sales');
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<SalesReport | ProfitabilityReport | StockUsageReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('RestoManager');
  const { t } = useI18n();

  useEffect(() => {
    apiClient.get('/admin/settings').then((res) => {
      if (res.data.data?.company_name) setRestaurantName(res.data.data.company_name);
    }).catch(() => {});
  }, []);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      switch (reportType) {
        case 'sales':
          data = await reportsService.getSalesReport(from, to);
          break;
        case 'profitability':
          data = await reportsService.getProfitabilityReport(from, to);
          break;
        case 'stock-usage':
          data = await reportsService.getStockUsageReport(from, to);
          break;
      }
      setReport(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      const blob = await reportsService.downloadReport(format, reportType, from, to, restaurantName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  const reportTypeLabels: Record<string, string> = {
    sales: t('reports.salesReport'),
    profitability: t('reports.profitabilityReport'),
    'stock-usage': t('reports.stockUsageReport'),
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('reports.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.type')}</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value as any); setReport(null); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sales">{t('reports.salesReport')}</option>
              <option value="profitability">{t('reports.profitabilityReport')}</option>
              <option value="stock-usage">{t('reports.stockUsageReport')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.from')}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.to')}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleGenerateReport} disabled={isLoading} className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium">
            {isLoading ? t('reports.generating') : t('reports.generate')}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!report} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('reports.exportPdf')}
          </button>
          <button onClick={() => handleExport('xlsx')} disabled={!report} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('reports.exportExcel')}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>}

      {report && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{reportTypeLabels[reportType]}</h2>
          {reportType === 'sales' && renderSalesReport(report as SalesReport, t)}
          {reportType === 'profitability' && renderProfitabilityReport(report as ProfitabilityReport, t)}
          {reportType === 'stock-usage' && renderStockUsageReport(report as StockUsageReport, t)}
        </div>
      )}

      {!report && !isLoading && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p>{t('reports.selectHint')}</p>
        </div>
      )}
    </div>
  );
}

function renderSalesReport(data: SalesReport, t: (key: string) => string) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">{t('reports.totalSales')}</p>
          <p className="text-2xl font-bold text-blue-700">{data.summary.totalSales.toLocaleString()} MRU</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">{t('reports.totalOrders')}</p>
          <p className="text-2xl font-bold text-green-700">{data.summary.totalOrders}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">{t('reports.averageTicket')}</p>
          <p className="text-2xl font-bold text-purple-700">{data.summary.averageTicket.toLocaleString()} MRU</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('reports.totalSales')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('reports.totalOrders')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('finance.cash')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('finance.card')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('finance.mobile')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.sales.map((day: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{day.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">{day.totalSales.toLocaleString()} MRU</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">{day.ordersCount}</td>
                <td className="px-4 py-3 text-sm text-green-600 text-right">{day.cashSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-blue-600 text-right">{day.cardSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-purple-600 text-right">{day.mobileSales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderProfitabilityReport(data: ProfitabilityReport, t: (key: string) => string) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">{t('reports.revenue')}</p>
        <p className="text-2xl font-bold text-green-700">{(data.revenue || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">{t('reports.expenses')}</p>
        <p className="text-2xl font-bold text-red-700">{(data.expenses || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">{t('reports.profit')}</p>
        <p className="text-2xl font-bold text-blue-700">{(data.profit || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">{t('reports.margin')}</p>
        <p className="text-2xl font-bold text-purple-700">{(data.margin || 0).toFixed(1)}%</p>
      </div>
    </div>
  );
}

function renderStockUsageReport(data: StockUsageReport, t: (key: string) => string) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('menu.product')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('reports.consumed')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('reports.replenished')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('reports.waste')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.items.map((item: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
              <td className="px-4 py-3 text-sm text-blue-600 text-right font-semibold">{item.consumed}</td>
              <td className="px-4 py-3 text-sm text-green-600 text-right font-semibold">{item.replenished}</td>
              <td className="px-4 py-3 text-sm text-red-600 text-right font-semibold">{item.waste}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
