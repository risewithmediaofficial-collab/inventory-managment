import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, PackageX, Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '@services/axios.js';

export default function IntelligentAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Cpu className="w-7 h-7 text-indigo-600" /> Intelligent Inventory & BI Analytics
        </h1>
        <p className="text-slate-500 text-sm">Automated demand patterns, fast/slow moving classification, and dead stock alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Fast-Moving Items</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">High Demand</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">18 Products</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-4 h-4" /> Recommend stocking +25%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Slow-Moving Items</span>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">Low Demand</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">7 Products</p>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium">
            <ArrowDownRight className="w-4 h-4" /> Consider promotional discounts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Dead Stock Alert</span>
            <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">No Movement 90d</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800">3 Products</p>
          <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-4 h-4" /> Locked Capital: ₹42,500
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Automated Inter-Branch Stock Rebalance Recommendations
        </h3>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 flex justify-between items-center">
          <div>
            <p className="font-bold">Transfer Recommendation: SKU-402 (Wireless Mouse)</p>
            <p className="text-xs text-indigo-700 mt-0.5">Move 20 units from Central Godown (Overstocked) to Branch 02 (High Demand, Low Stock)</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
            Approve Auto-Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
