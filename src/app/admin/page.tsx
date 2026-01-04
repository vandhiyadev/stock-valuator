'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, BarChart3, Star, Shield, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: string;
  _count: {
    watchlist: number;
    usage: number;
  };
}

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  todayAnalyses: number;
  tierBreakdown: Record<string, number>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAnalyses: 0,
    todayAnalyses: 0,
    tierBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    // Check if user is admin
    const userTier = (session?.user as { tier?: string })?.tier;
    if (!session || userTier !== 'admin') {
      router.push('/');
      return;
    }

    fetchAdminData();
  }, [session, status, router]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
    setLoading(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userTier = (session?.user as { tier?: string })?.tier;
  if (!session || userTier !== 'admin') {
    return null;
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-xs text-slate-400">Manage users and view stats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400">Total Analyses</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalAnalyses}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-slate-400">Today&apos;s Analyses</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.todayAnalyses}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400">Tier Breakdown</span>
            </div>
            <div className="space-y-1 text-sm">
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex justify-between">
                  <span className="text-slate-400 capitalize">{tier}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Users Table */}
        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              All Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="py-3 px-4 text-left text-slate-400 text-sm font-medium">User</th>
                  <th className="py-3 px-4 text-left text-slate-400 text-sm font-medium">Tier</th>
                  <th className="py-3 px-4 text-center text-slate-400 text-sm font-medium">Watchlist</th>
                  <th className="py-3 px-4 text-center text-slate-400 text-sm font-medium">Analyses</th>
                  <th className="py-3 px-4 text-left text-slate-400 text-sm font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{user.name || 'No name'}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.tier === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.tier === 'pro' ? 'bg-emerald-500/20 text-emerald-400' :
                        user.tier === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {user._count.watchlist}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white">{user._count.usage}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
