'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, BarChart3, Star, Shield, Clock, ArrowLeft, Trash2, Eye, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SavedAnalysis {
  id: string;
  symbol: string;
  name: string | null;
  savedAt: string;
  notes: string | null;
}

interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  tier: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [usage, setUsage] = useState<UsageInfo>({ used: 0, limit: 5, remaining: 5, tier: 'free' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'watchlist'>('saved');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchProfileData();
  }, [session, status, router]);

  const fetchProfileData = async () => {
    try {
      const [analysesRes, watchlistRes, usageRes] = await Promise.all([
        fetch('/api/saved-analyses'),
        fetch('/api/watchlist'),
        fetch('/api/usage'),
      ]);

      const [analysesData, watchlistData, usageData] = await Promise.all([
        analysesRes.json(),
        watchlistRes.json(),
        usageRes.json(),
      ]);

      if (analysesData.success) setSavedAnalyses(analysesData.analyses);
      if (watchlistData.success) setWatchlist(watchlistData.watchlist);
      if (usageData.success) setUsage({
        used: usageData.used,
        limit: usageData.limit,
        remaining: usageData.remaining,
        tier: usageData.tier,
      });
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
    setLoading(false);
  };

  const deleteSavedAnalysis = async (id: string) => {
    try {
      await fetch('/api/saved-analyses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSavedAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'basic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'admin':
        return ['Unlimited daily analyses', 'Unlimited watchlist', 'Unlimited saved analyses', 'Admin dashboard access'];
      case 'pro':
        return ['500 daily analyses', '200 watchlist stocks', '100 saved analyses', 'Priority support'];
      case 'basic':
        return ['50 daily analyses', '50 watchlist stocks', '25 saved analyses', 'Email support'];
      default:
        return ['5 daily analyses', '10 watchlist stocks', '5 saved analyses', 'Community support'];
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const userTier = (session.user as { tier?: string })?.tier || 'free';

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
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">My Profile</h1>
                  <p className="text-xs text-slate-400">Manage your account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* User Info Card */}
        <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white">
                {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{session.user?.name || 'User'}</h2>
                <p className="text-slate-400">{session.user?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${getTierColor(userTier)}`}>
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {usage.limit === Infinity ? '∞' : usage.remaining}
                </p>
                <p className="text-slate-400 text-sm">Analyses Left</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{watchlist.length}</p>
                <p className="text-slate-400 text-sm">Watchlist</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{savedAnalyses.length}</p>
                <p className="text-slate-400 text-sm">Saved</p>
              </div>
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <h3 className="text-white font-semibold mb-3">Your Benefits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getTierBenefits(userTier).map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'saved'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Saved Analyses ({savedAnalyses.length})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'watchlist'
                ? 'text-yellow-400 border-yellow-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Watchlist ({watchlist.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'saved' && (
          <section className="space-y-4">
            {savedAnalyses.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No saved analyses yet</p>
                <p className="text-slate-500 text-sm mt-2">Analyze a stock and click &quot;Save&quot; to save it here</p>
                <Link href="/" className="inline-block mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Analyze a Stock
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{analysis.symbol}</h3>
                        <p className="text-slate-400 text-sm">{analysis.name || 'Stock Analysis'}</p>
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Saved {new Date(analysis.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/?symbol=${analysis.symbol}`}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="View Analysis"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => deleteSavedAnalysis(analysis.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'watchlist' && (
          <section className="space-y-4">
            {watchlist.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Your watchlist is empty</p>
                <p className="text-slate-500 text-sm mt-2">Add stocks to track them here</p>
                <Link href="/" className="inline-block mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Find Stocks
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors"
                  >
                    <Link href={`/?symbol=${item.symbol}`} className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.symbol}</h3>
                        <p className="text-slate-400 text-sm truncate">{item.name || 'Stock'}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWatchlist(item.symbol);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Settings Section */}
        <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-4">Account Settings</h3>
          <div className="space-y-3">
            <Link
              href="/auth/reset-password"
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300">Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
