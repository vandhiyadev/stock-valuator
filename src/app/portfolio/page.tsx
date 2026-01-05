'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Loader2, Wallet, RefreshCw, X } from 'lucide-react';

interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

interface Summary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: number;
}

const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '$0';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalValue: 0, totalCost: 0, totalGainLoss: 0, totalGainLossPercent: 0, holdings: 0 });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', name: '', quantity: '', avgCost: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Portfolio error:', err);
    }
    setLoading(false);
  };

  const addToPortfolio = async () => {
    if (!addForm.symbol || !addForm.quantity || !addForm.avgCost) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: addForm.symbol.toUpperCase(),
          name: addForm.name || addForm.symbol.toUpperCase(),
          quantity: parseFloat(addForm.quantity),
          avgCost: parseFloat(addForm.avgCost),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ symbol: '', name: '', quantity: '', avgCost: '' });
        await fetchPortfolio();
      } else {
        alert(data.error || 'Failed to add stock');
      }
    } catch (err) {
      console.error('Add to portfolio error:', err);
      alert('Failed to add stock');
    }
    setAddLoading(false);
  };

  const removeFromPortfolio = async (id: string) => {
    if (!confirm('Remove this stock from your portfolio?')) return;
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchPortfolio();
      }
    } catch (err) {
      console.error('Remove from portfolio error:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPortfolio();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-400 mb-6">Please sign in to access your Portfolio</p>
          <Link href="/auth/signin" className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Portfolio Tracker</h1>
                  <p className="text-xs text-slate-400">Track your investments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPortfolio}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Total Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalValue)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-slate-300">{formatCurrency(summary.totalCost)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">Return %</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${summary.totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.totalGainLossPercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {summary.totalGainLossPercent >= 0 ? '+' : ''}{summary.totalGainLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Holdings ({summary.holdings})</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            </div>
          ) : portfolio.length === 0 ? (
            <div className="text-center py-20">
              <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Your portfolio is empty</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Your First Stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="text-left py-4 px-6 text-slate-400 font-medium">Stock</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Qty</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Avg Cost</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Current</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Value</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Gain/Loss</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Day Change</th>
                    <th className="text-center py-4 px-6 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/?symbol=${item.symbol}`} className="hover:underline">
                          <div className="font-semibold text-white">{item.symbol}</div>
                          <div className="text-slate-400 text-sm truncate max-w-[150px]">{item.name}</div>
                        </Link>
                      </td>
                      <td className="text-right py-4 px-6 text-white font-mono">{item.quantity}</td>
                      <td className="text-right py-4 px-6 text-slate-300 font-mono">{formatCurrency(item.avgCost)}</td>
                      <td className="text-right py-4 px-6 text-white font-mono">{formatCurrency(item.currentPrice)}</td>
                      <td className="text-right py-4 px-6 text-white font-mono">{formatCurrency(item.currentValue)}</td>
                      <td className={`text-right py-4 px-6 font-mono ${item.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div>{item.gainLoss >= 0 ? '+' : ''}{formatCurrency(item.gainLoss)}</div>
                        <div className="text-xs">({item.gainLossPercent >= 0 ? '+' : ''}{item.gainLossPercent.toFixed(2)}%)</div>
                      </td>
                      <td className={`text-right py-4 px-6 font-mono ${item.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                      </td>
                      <td className="text-center py-4 px-6">
                        <button
                          onClick={() => removeFromPortfolio(item.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add to Portfolio</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Symbol *</label>
                <input
                  type="text"
                  value={addForm.symbol}
                  onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g. AAPL, RELIANCE.NS"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Name (optional)</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Apple Inc"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Avg Cost *</label>
                  <input
                    type="number"
                    value={addForm.avgCost}
                    onChange={(e) => setAddForm({ ...addForm, avgCost: e.target.value })}
                    placeholder="e.g. 150.00"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addToPortfolio}
                disabled={addLoading || !addForm.symbol || !addForm.quantity || !addForm.avgCost}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
