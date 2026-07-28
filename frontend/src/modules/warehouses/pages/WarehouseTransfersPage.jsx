import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, CheckCircle, Truck, PackageCheck } from 'lucide-react';
import api from '@services/axios.js';

export default function WarehouseTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo / API fetch for stock transfers
    setTransfers([
      {
        _id: '1',
        transferNumber: 'TRF-2026-001',
        fromWarehouse: 'Central Godown',
        toWarehouse: 'Branch 01 Warehouse',
        itemsCount: 15,
        status: 'dispatched',
        date: '2026-07-24',
      },
      {
        _id: '2',
        transferNumber: 'TRF-2026-002',
        fromWarehouse: 'Branch 01 Warehouse',
        toWarehouse: 'Branch 02 Warehouse',
        itemsCount: 8,
        status: 'received',
        date: '2026-07-23',
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Godown & Warehouse Transfers</h1>
          <p className="text-slate-500 text-sm">Transfer stock between central Godown and branch warehouses with approval</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
          <Plus className="w-4 h-4" /> Create Stock Transfer Request
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Transfer #</th>
              <th className="p-4">Source Warehouse</th>
              <th className="p-4">Destination Warehouse</th>
              <th className="p-4">Items</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfers.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{t.transferNumber}</td>
                <td className="p-4">{t.fromWarehouse}</td>
                <td className="p-4 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-500" /> {t.toWarehouse}
                </td>
                <td className="p-4">{t.itemsCount} units</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                    t.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
