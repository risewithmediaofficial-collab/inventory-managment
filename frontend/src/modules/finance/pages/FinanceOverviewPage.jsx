import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, BookOpen, FileText, PieChart, Landmark, Wallet, Plus } from 'lucide-react';
import api from '@services/axios.js';

export default function FinanceOverviewPage() {
  const [activeTab, setActiveTab] = useState('pl'); // 'pl', 'daybook', 'journal', 'balancesheet'
  const [plData, setPlData] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const [plRes, journalRes] = await Promise.all([
          api.get('/finance/reports/profit-loss'),
          api.get('/finance/journal-entries').catch(() => ({ data: { data: [] } })),
        ]);
        setPlData(plRes.data.data || { totalIncome: 0, totalExpense: 0, netProfit: 0 });
        setJournals(journalRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Finance & Day Book</h1>
          <p className="text-slate-500 text-xs">Vyapar-style Cash Book, Bank Book, Day Register, P&L, and Balance Sheet</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {[
            { id: 'pl', label: 'Profit & Loss', icon: PieChart },
            { id: 'daybook', label: 'Cash & Bank Daybook', icon: Wallet },
            { id: 'journal', label: 'Journal Entries', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'hover:text-slate-900'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">₹{plData.totalIncome?.toLocaleString('en-IN') || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">₹{plData.totalExpense?.toLocaleString('en-IN') || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black font-mono ${plData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{plData.netProfit?.toLocaleString('en-IN') || 0}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pl' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Statement of Profit & Loss</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-4 bg-emerald-50/40 border-emerald-100">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Income Sources</h4>
              <p className="text-2xs text-slate-500">Sales Invoices & Direct Income entries</p>
              <div className="mt-4 text-xl font-black text-emerald-700 font-mono">₹{plData.totalIncome?.toLocaleString('en-IN')}</div>
            </div>
            <div className="border rounded-xl p-4 bg-rose-50/40 border-rose-100">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">Expense Breakdown</h4>
              <p className="text-2xs text-slate-500">Purchase bills & Operational expenses</p>
              <div className="mt-4 text-xl font-black text-rose-700 font-mono">₹{plData.totalExpense?.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'daybook' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-base mb-4">Cash Book & Day Register</h3>
          <div className="text-xs text-slate-500 p-4 border border-dashed rounded-xl bg-slate-50 text-center">
            All daily cash collection, POS payments, bank transfers, and vendor payouts are automatically tracked in the Day Book.
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-800 text-base">Double-Entry Journal Registers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-2xs uppercase text-slate-500 font-bold">
                  <th className="p-3">Entry #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Narration / Description</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">No manual journal entries recorded yet. Standard transactions post automatically.</td>
                  </tr>
                ) : (
                  journals.map((j) => (
                    <tr key={j._id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-800">{j.entryNumber}</td>
                      <td className="p-3 text-slate-500">{new Date(j.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-slate-700">{j.narration}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{j.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{j.totalAmount?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
