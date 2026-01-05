'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, Loader2, Star, RefreshCw, ChevronDown } from 'lucide-react';

interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  forwardPE: number;
  dividendYield: number;
  valuationScore: number;
}

const LISTS = [
  { id: 'us-largecap', name: 'US Large Cap', flag: '🇺🇸' },
  { id: 'us-tech', name: 'US Technology', flag: '🇺🇸' },
  { id: 'us-financial', name: 'US Financial', flag: '🇺🇸' },
  { id: 'india-nifty50', name: 'India Nifty 50', flag: '🇮🇳' },
  { id: 'india-it', name: 'India IT', flag: '🇮🇳' },
  { id: 'india-banks', name: 'India Banks', flag: '🇮🇳' },
];

const formatCurrency = (value: number, isIndian: boolean = false): string => {
  if (isNaN(value) || !isFinite(value)) return isIndian ? '₹0' : '$0';
  const symbol = isIndian ? '₹' : '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatLargeCurrency = (value: number, isIndian: boolean = false): string => {
  if (isNaN(value) || !isFinite(value)) return isIndian ? '₹0' : '$0';
  const symbol = isIndian ? '₹' : '$';
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(0)}M`;
  return `${symbol}${value.toFixed(0)}`;
};

export default function ScreenerPage() {
  const { data: session, status } = useSession();
  const [stocks, setStocks] = useState<ScreenedStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState('us-largecap');
  const [sortBy, setSortBy] = useState('valuationScore');
  const [maxPE, setMaxPE] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const isIndianList = selectedList.includes('india');

  const fetchStocks = async () => {
    setLoading(true);
    try {
      let url = `/api/screener?list=${selectedList}&sortBy=${sortBy}`;
      if (maxPE) url += `&maxPE=${maxPE}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStocks(data.stocks);
      }
    } catch (err) {
      console.error('Screener error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, [selectedList, sortBy]);

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
          <p className="text-slate-400 mb-6">Please sign in to access the Stock Screener</p>
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Stock Screener</h1>
                  <p className="text-xs text-slate-400">Find undervalued stocks</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchStocks}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* List Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {LISTS.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedList === list.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{list.flag}</span>
              <span>{list.name}</span>
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Max P/E Ratio</label>
                <input
                  type="number"
                  value={maxPE}
                  onChange={(e) => setMaxPE(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 25"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="valuationScore">Valuation Score</option>
                  <option value="pe">P/E Ratio</option>
                  <option value="dividendYield">Dividend Yield</option>
                  <option value="changePercent">Change %</option>
                  <option value="marketCap">Market Cap</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchStocks}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Screening stocks...</p>
                <p className="text-slate-500 text-sm mt-2">This may take a moment</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="text-left py-4 px-6 text-slate-400 font-medium">Stock</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Change</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">P/E</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Fwd P/E</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Div Yield</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Market Cap</th>
                    <th className="text-center py-4 px-6 text-slate-400 font-medium">Score</th>
                    <th className="text-center py-4 px-6 text-slate-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, index) => (
                    <tr key={stock.symbol} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{stock.symbol}</div>
                            <div className="text-slate-400 text-sm truncate max-w-[150px]">{stock.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-6 text-white font-mono">
                        {formatCurrency(stock.price, isIndianList)}
                      </td>
                      <td className={`text-right py-4 px-6 font-mono ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className={`text-right py-4 px-6 font-mono ${stock.pe < 20 ? 'text-emerald-400' : stock.pe < 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {stock.pe > 0 ? stock.pe.toFixed(1) : 'N/A'}
                      </td>
                      <td className="text-right py-4 px-6 text-slate-300 font-mono">
                        {stock.forwardPE > 0 ? stock.forwardPE.toFixed(1) : 'N/A'}
                      </td>
                      <td className="text-right py-4 px-6 text-slate-300 font-mono">
                        {(stock.dividendYield * 100).toFixed(2)}%
                      </td>
                      <td className="text-right py-4 px-6 text-slate-300 font-mono">
                        {formatLargeCurrency(stock.marketCap, isIndianList)}
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                          stock.valuationScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                          stock.valuationScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {stock.valuationScore >= 70 && <Star className="w-3 h-3" />}
                          {stock.valuationScore}
                        </div>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Link
                          href={`/?symbol=${stock.symbol}`}
                          className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium"
                        >
                          Analyze
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && stocks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-400">No stocks found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/20"></div>
            <span className="text-slate-400">Score 70+ = Potentially Undervalued</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
            <span className="text-slate-400">Score 50-69 = Fairly Valued</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20"></div>
            <span className="text-slate-400">Score &lt;50 = Potentially Overvalued</span>
          </div>
        </div>
      </main>
    </div>
  );
}
