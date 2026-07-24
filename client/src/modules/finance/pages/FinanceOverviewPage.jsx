import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, BookOpen, FileText, PieChart } from 'lucide-react';
import api from '@services/axios.js';

export default function FinanceOverviewPage() {
  const [data, setData] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await api.get('/finance/reports/profit-loss');
        setData(res.data.data || { totalIncome: 0, totalExpense: 0, netProfit: 0 });
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Finance & General Ledger</h1>
        <p className="text-slate-500 text-sm">Financial performance, profit & loss, cash/bank balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Total Income</span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">₹{data.totalIncome?.toLocaleString() || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Total Expenses</span>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">₹{data.totalExpense?.toLocaleString() || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Net Profit</span>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{data.netProfit?.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
