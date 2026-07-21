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
      <h1 className="text-2xl font-bold dark:text-white text-surface-900 mb-6">{t('reports.title')}</h1>

      <div className="card rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">{t('reports.type')}</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value as any); setReport(null); }}
              className="input-field w-full"
            >
              <option value="sales">{t('reports.salesReport')}</option>
              <option value="profitability">{t('reports.profitabilityReport')}</option>
              <option value="stock-usage">{t('reports.stockUsageReport')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">{t('reports.from')}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">{t('reports.to')}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-full" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary px-5 py-2">
            {isLoading ? t('reports.generating') : t('reports.generate')}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!report} className="flex items-center gap-2 bg-coral-500 text-white px-4 py-2 rounded-md hover:bg-coral-600 disabled:opacity-50 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('reports.exportPdf')}
          </button>
          <button onClick={() => handleExport('xlsx')} disabled={!report} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('reports.exportExcel')}
          </button>
        </div>
      </div>

      {error && <div className="bg-coral-500/10 border border-coral-500/20 text-coral-400 px-4 py-3 rounded-md mb-4">{error}</div>}

      {report && (
        <div className="card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold dark:text-white text-surface-900 mb-4">{reportTypeLabels[reportType]}</h2>
          {reportType === 'sales' && renderSalesReport(report as SalesReport, t)}
          {reportType === 'profitability' && renderProfitabilityReport(report as ProfitabilityReport, t)}
          {reportType === 'stock-usage' && renderStockUsageReport(report as StockUsageReport, t)}
        </div>
      )}

      {!report && !isLoading && (
        <div className="card rounded-lg shadow p-12 text-center text-surface-400">
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
        <div className="bg-blue-500/10 p-4 rounded-lg">
          <p className="text-sm text-surface-400">{t('reports.totalSales')}</p>
          <p className="text-2xl font-bold text-blue-400">{data.summary.totalSales.toLocaleString()} MRU</p>
        </div>
        <div className="bg-brand-500/10 p-4 rounded-lg">
          <p className="text-sm text-surface-400">{t('reports.totalOrders')}</p>
          <p className="text-2xl font-bold text-brand-400">{data.summary.totalOrders}</p>
        </div>
        <div className="bg-purple-500/10 p-4 rounded-lg">
          <p className="text-sm text-surface-400">{t('reports.averageTicket')}</p>
          <p className="text-2xl font-bold text-purple-400">{data.summary.averageTicket.toLocaleString()} MRU</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y dark:divide-white/5 divide-black/5">
          <thead className="dark:bg-white/5 bg-black/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase">{t('common.date')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('reports.totalSales')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('reports.totalOrders')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('finance.cash')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('finance.card')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('finance.mobile')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5 divide-black/5">
            {data.sales.map((day: any, i: number) => (
              <tr key={i} className="dark:hover:bg-white/5 hover:bg-black/5">
                <td className="px-4 py-3 text-sm font-medium dark:text-white text-surface-900">{day.date}</td>
                <td className="px-4 py-3 text-sm dark:text-white text-surface-900 text-right font-semibold">{day.totalSales.toLocaleString()} MRU</td>
                <td className="px-4 py-3 text-sm text-surface-400 text-right">{day.ordersCount}</td>
                <td className="px-4 py-3 text-sm text-brand-400 text-right">{day.cashSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-blue-400 text-right">{day.cardSales.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-purple-400 text-right">{day.mobileSales.toLocaleString()}</td>
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
      <div className="bg-brand-500/10 p-4 rounded-lg">
        <p className="text-sm text-surface-400">{t('reports.revenue')}</p>
        <p className="text-2xl font-bold text-brand-400">{(data.revenue || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-coral-500/10 p-4 rounded-lg">
        <p className="text-sm text-surface-400">{t('reports.expenses')}</p>
        <p className="text-2xl font-bold text-coral-400">{(data.expenses || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-blue-500/10 p-4 rounded-lg">
        <p className="text-sm text-surface-400">{t('reports.profit')}</p>
        <p className="text-2xl font-bold text-blue-400">{(data.profit || 0).toLocaleString()} MRU</p>
      </div>
      <div className="bg-purple-500/10 p-4 rounded-lg">
        <p className="text-sm text-surface-400">{t('reports.margin')}</p>
        <p className="text-2xl font-bold text-purple-400">{(data.margin || 0).toFixed(1)}%</p>
      </div>
    </div>
  );
}

function renderStockUsageReport(data: StockUsageReport, t: (key: string) => string) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y dark:divide-white/5 divide-black/5">
        <thead className="dark:bg-white/5 bg-black/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase">{t('menu.product')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('reports.consumed')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('reports.replenished')}</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase">{t('reports.waste')}</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-white/5 divide-black/5">
          {data.items.map((item: any, i: number) => (
            <tr key={i} className="dark:hover:bg-white/5 hover:bg-black/5">
              <td className="px-4 py-3 text-sm font-medium dark:text-white text-surface-900">{item.name}</td>
              <td className="px-4 py-3 text-sm text-blue-400 text-right font-semibold">{item.consumed}</td>
              <td className="px-4 py-3 text-sm text-brand-400 text-right font-semibold">{item.replenished}</td>
              <td className="px-4 py-3 text-sm text-coral-400 text-right font-semibold">{item.waste}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
