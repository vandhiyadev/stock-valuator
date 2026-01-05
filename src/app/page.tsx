/**
 * Main Dashboard Page
 * Stock Analysis and Valuation Tool
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info, DollarSign, BarChart3, Target, Shield, User, LogOut, Star, Heart, X, List, Save, Check, Sparkles, Loader2, Users, LineChart, FileDown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

// Demo data for display when API key is not configured
const demoAnalysis = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  analysisDate: new Date(),
  quote: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.50,
    previousClose: 177.25,
    change: 1.25,
    changePercent: 0.70,
    volume: 52340000,
    marketCap: 2780000000000,
    sharesOutstanding: 15580000000,
    beta: 1.28,
    pe: 28.5,
    forwardPE: 25.2,
    eps: 6.26,
    forwardEps: 7.08,
    dividendYield: 0.52,
    fiftyTwoWeekHigh: 199.62,
    fiftyTwoWeekLow: 124.17,
    sma50: 175.20,
    sma200: 168.45,
    timestamp: new Date(),
  },
  dcf: {
    intrinsicPrice: 215.40,
    currentPrice: 178.50,
    upside: 0.207,
    marginOfSafety: 0.207,
    wacc: 0.098,
    enterpriseValue: 3150000000000,
    equityValue: 3350000000000,
    terminalValue: 2850000000000,
    terminalValuePV: 980000000000,
    projections: [],
  },
  earningsMultiple: {
    eps: 6.26,
    forwardEps: 7.08,
    historicalPELow: 18,
    historicalPEHigh: 35,
    historicalPEMedian: 24,
    selectedPE: 26,
    fairValue: 184.08,
    currentPrice: 178.50,
    upside: 0.031,
  },
  reverseDCF: {
    impliedGrowthRate: 0.12,
    sustainableYears: 10,
    isReasonable: true,
    assessment: 'Market expects 12% growth - reasonably optimistic',
  },
  technicalScore: {
    score: 68,
    signals: [
      { name: 'Trend Direction', value: 'bullish', signal: 'bullish', weight: 0.25 },
      { name: 'RSI', value: '54', signal: 'neutral', weight: 0.20 },
      { name: 'MACD', value: '1.25', signal: 'bullish', weight: 0.20 },
      { name: 'Price vs SMA50', value: '1.9%', signal: 'bullish', weight: 0.15 },
      { name: 'Price vs SMA200', value: '6.0%', signal: 'bullish', weight: 0.20 },
    ],
  },
  fundamentalScore: {
    score: 82,
    factors: [
      { name: 'Return on Invested Capital', value: 0.45, score: 100, weight: 0.20, assessment: 'Exceptional ROIC' },
      { name: 'Revenue Growth (5Y)', value: 0.08, score: 60, weight: 0.15, assessment: 'Moderate growth' },
      { name: 'FCF Growth (5Y)', value: 0.12, score: 75, weight: 0.15, assessment: 'Strong growth' },
      { name: 'Debt Management', value: 1.2, score: 85, weight: 0.10, assessment: 'Low debt' },
      { name: 'Profit Margins', value: 0.25, score: 100, weight: 0.10, assessment: 'Excellent margins' },
    ],
  },
  confidenceScore: {
    score: 78,
    factors: [
      { name: 'Data Completeness', score: 100, weight: 0.25, reason: '10 years of data available' },
      { name: 'Earnings Stability', score: 80, weight: 0.20, reason: 'Stable earnings history' },
      { name: 'Model Convergence', score: 70, weight: 0.20, reason: 'Valuation models mostly agree' },
      { name: 'Margin of Safety', score: 70, weight: 0.20, reason: '20.7% margin of safety' },
    ],
  },
  fairValue: 203.50,
  currentPrice: 178.50,
  upside: 0.14,
  marginOfSafety: 0.14,
  buyZone: { low: 152.63, high: 162.80 },
  riskFactors: [
    { category: 'market', severity: 'low', description: 'High valuation relative to market' },
  ],
  recommendation: 'HOLD' as const,
  summary: 'Apple Inc. (AAPL) is trading at a reasonable valuation with modest upside. The company demonstrates excellent fundamental quality with strong cash flows and returns on capital. Technical indicators are bullish with positive momentum. Recommendation: Hold - Wait for better entry or exit depending on position.',
  financials: {
    income: [
      { fiscalYear: 2025, revenue: 416161000000, netIncome: 112010000000, netIncomeMargin: 0.269 },
      { fiscalYear: 2024, revenue: 391035000000, netIncome: 93736000000, netIncomeMargin: 0.240 },
      { fiscalYear: 2023, revenue: 383285000000, netIncome: 96995000000, netIncomeMargin: 0.253 },
      { fiscalYear: 2022, revenue: 394328000000, netIncome: 99803000000, netIncomeMargin: 0.253 },
    ],
    balance: [],
    cashFlow: [],
  },
  grahamNumber: {
    eps: 6.42,
    bookValuePerShare: 4.38,
    grahamNumber: 25.14,
    currentPrice: 178.50,
    upside: -0.86,
    isBelowGraham: false,
  },
};

// Color and display utilities for valuation result
const getValuationColor = (rec: string): string => {
  switch (rec) {
    case 'STRONG_BUY': return 'bg-emerald-500';
    case 'BUY': return 'bg-green-500';
    case 'HOLD': return 'bg-yellow-500';
    case 'AVOID': return 'bg-orange-500';
    case 'STRONG_AVOID': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

// Display user-friendly labels instead of internal codes
const getValuationLabel = (rec: string): string => {
  switch (rec) {
    case 'STRONG_BUY': return 'Significantly Undervalued';
    case 'BUY': return 'Undervalued';
    case 'HOLD': return 'Fairly Valued';
    case 'AVOID': return 'Overvalued';
    case 'STRONG_AVOID': return 'Significantly Overvalued';
    default: return 'Analysis Pending';
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
};

const formatCurrency = (value: number, currency: string = '$'): string => {
  if (isNaN(value) || !isFinite(value)) return `${currency}0.00`;
  return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatLargeCurrency = (value: number, currency: string = '$'): string => {
  if (isNaN(value) || !isFinite(value)) return `${currency}0`;
  if (value >= 1e12) return `${currency}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${currency}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${currency}${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${currency}${(value / 1e3).toFixed(2)}K`;
  return formatCurrency(value, currency);
};

const formatPercent = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${(value * 100).toFixed(1)}%`;
};

// Exchange options with currency info
const EXCHANGES = [
  { value: '', label: 'US (NYSE/NASDAQ)', suffix: '', currency: '$', currencyName: 'USD' },
  { value: '.NS', label: '🇮🇳 India NSE', suffix: '.NS', currency: '₹', currencyName: 'INR' },
  { value: '.BO', label: '🇮🇳 India BSE', suffix: '.BO', currency: '₹', currencyName: 'INR' },
  { value: '.L', label: '🇬🇧 London', suffix: '.L', currency: '£', currencyName: 'GBP' },
  { value: '.HK', label: '🇭🇰 Hong Kong', suffix: '.HK', currency: 'HK$', currencyName: 'HKD' },
  { value: '.TO', label: '🇨🇦 Toronto', suffix: '.TO', currency: 'C$', currencyName: 'CAD' },
  { value: '.AX', label: '🇦🇺 Australia', suffix: '.AX', currency: 'A$', currencyName: 'AUD' },
];

// Helper to get currency symbol for a symbol (handles ADRs and foreign stocks)
const getCurrencyForSymbol = (symbol: string, exchange: string = ''): { symbol: string; name: string; isADR: boolean } => {
  // Check if it's an ADR (foreign stock listed on US exchange - like HMC, TM, etc.)
  // ADRs report financials in their home currency but trade in USD
  const knownADRs: Record<string, { currency: string; name: string }> = {
    'HMC': { currency: '¥', name: 'JPY' },     // Honda - Japan
    'TM': { currency: '¥', name: 'JPY' },      // Toyota - Japan
    'SONY': { currency: '¥', name: 'JPY' },    // Sony - Japan
    'NIO': { currency: '¥', name: 'CNY' },     // NIO - China
    'BABA': { currency: '¥', name: 'CNY' },    // Alibaba - China
    'TSM': { currency: 'NT$', name: 'TWD' },   // TSMC - Taiwan
    'SAP': { currency: '€', name: 'EUR' },     // SAP - Germany
    'NVS': { currency: 'CHF', name: 'CHF' },   // Novartis - Switzerland
    'UL': { currency: '€', name: 'EUR' },      // Unilever - UK/NL
  };
  
  const baseSymbol = symbol.split('.')[0];
  if (knownADRs[baseSymbol]) {
    return { symbol: knownADRs[baseSymbol].currency, name: knownADRs[baseSymbol].name, isADR: true };
  }
  
  // Detect from symbol suffix (e.g., ITC.NS -> NSE -> INR)
  const suffixMatch = symbol.match(/\.([A-Z]{1,3})$/i);
  if (suffixMatch) {
    const suffix = '.' + suffixMatch[1].toUpperCase();
    const exchangeInfo = EXCHANGES.find(e => e.suffix === suffix);
    if (exchangeInfo && exchangeInfo.currency) {
      return { symbol: exchangeInfo.currency, name: exchangeInfo.currencyName, isADR: false };
    }
  }
  
  // Find exchange info from exchange state (fallback)
  if (exchange) {
    const exchangeInfo = EXCHANGES.find(e => e.value === exchange);
    if (exchangeInfo && exchangeInfo.currency) {
      return { symbol: exchangeInfo.currency, name: exchangeInfo.currencyName, isADR: false };
    }
  }
  
  return { symbol: '$', name: 'USD', isADR: false };
};

export default function DashboardPage() {
  // Auth session
  const { data: session, status } = useSession();
  
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('');
  const [analysis, setAnalysis] = useState<typeof demoAnalysis | null>(demoAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  
  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{symbol: string; name: string; exchange: string; type: string}>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Disclaimer modal state
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  
  // Watchlist state
  const [watchlist, setWatchlist] = useState<Array<{id: string; symbol: string; name: string; exchange: string}>>([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  
  // Usage tracking state
  const [usage, setUsage] = useState<{used: number; limit: number; remaining: number; tier: string}>({
    used: 0,
    limit: 5,
    remaining: 5,
    tier: 'free'
  });
  
  // AI Analysis state
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // Peer Comparison state
  interface PeerStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number;
    pe: number;
    forwardPE: number;
    dividendYield: number;
    priceToBook: number;
  }
  const [peers, setPeers] = useState<PeerStock[]>([]);
  const [peerAverages, setPeerAverages] = useState<{pe: number; forwardPE: number; dividendYield: number; priceToBook: number}>({pe: 0, forwardPE: 0, dividendYield: 0, priceToBook: 0});
  const [peersLoading, setPeersLoading] = useState(false);
  const [showPeers, setShowPeers] = useState(false);
  
  // Historical Chart state
  interface HistoricalDataPoint {
    date: string;
    price: number;
    fairValue: number | null;
    buyZone: number | null;
  }
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [historicalStats, setHistoricalStats] = useState<{valuationStatus: string; avgPrice: number; avgFairValue: number}>({valuationStatus: '', avgPrice: 0, avgFairValue: 0});
  const [historicalPeriod, setHistoricalPeriod] = useState('1y');
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  
  // Show disclaimer on first visit
  useEffect(() => {
    const hasAcceptedDisclaimer = localStorage.getItem('disclaimerAccepted');
    if (!hasAcceptedDisclaimer) {
      setShowDisclaimerModal(true);
    }
  }, []);
  
  // Fetch watchlist and usage when session changes
  useEffect(() => {
    if (session) {
      fetchWatchlist();
      fetchUsage();
    }
  }, [session]);
  
  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      if (data.success) {
        setWatchlist(data.watchlist);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };
  
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      if (data.success) {
        setUsage({
          used: data.used,
          limit: data.limit,
          remaining: data.remaining,
          tier: data.tier
        });
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };
  
  const addToWatchlist = async () => {
    if (!analysis || !session) return;
    setWatchlistLoading(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: analysis.symbol,
          name: analysis.name,
          exchange: exchange || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchWatchlist();
      } else {
        alert(data.error || 'Failed to add to watchlist');
      }
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
    setWatchlistLoading(false);
  };
  
  const removeFromWatchlist = async (symbolToRemove: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolToRemove }),
      });
      const data = await res.json();
      if (data.success) {
        setWatchlist(prev => prev.filter(w => w.symbol !== symbolToRemove));
      }
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };
  
  const isInWatchlist = (sym: string) => {
    return watchlist.some(w => w.symbol === sym);
  };
  
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  
  const saveAnalysis = async () => {
    if (!analysis || !session) return;
    setSavingAnalysis(true);
    try {
      const res = await fetch('/api/saved-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: analysis.symbol,
          name: analysis.name,
          data: analysis,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisSaved(true);
        setTimeout(() => setAnalysisSaved(false), 3000);
      } else {
        alert(data.error || 'Failed to save analysis');
      }
    } catch (err) {
      console.error('Failed to save analysis:', err);
    }
    setSavingAnalysis(false);
  };
  
  const acceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimerModal(false);
  };
  
  // Fetch AI analysis
  const fetchAiAnalysis = async () => {
    if (!analysis) return;
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(data.aiSummary);
      } else {
        setAiSummary('Unable to generate AI analysis. Please try again later.');
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      setAiSummary('Unable to generate AI analysis. Please try again later.');
    }
    setAiLoading(false);
  };
  
  // Fetch peer comparison data
  const fetchPeers = async () => {
    if (!analysis) return;
    setPeersLoading(true);
    setShowPeers(true);
    try {
      const res = await fetch(`/api/peers?symbol=${analysis.symbol}&sector=${encodeURIComponent(analysis.sector)}&industry=${encodeURIComponent(analysis.industry)}`);
      const data = await res.json();
      if (data.success) {
        setPeers(data.peers);
        setPeerAverages(data.averages);
      }
    } catch (err) {
      console.error('Peer comparison error:', err);
    }
    setPeersLoading(false);
  };
  // Fetch historical valuation data
  const fetchHistoricalData = async (period: string = historicalPeriod) => {
    if (!analysis) return;
    setHistoricalLoading(true);
    setShowHistorical(true);
    setHistoricalPeriod(period);
    try {
      const res = await fetch(`/api/historical?symbol=${analysis.symbol}&period=${period}`);
      const data = await res.json();
      if (data.success) {
        setHistoricalData(data.chartData);
        setHistoricalStats(data.stats);
      }
    } catch (err) {
      console.error('Historical data error:', err);
    }
    setHistoricalLoading(false);
  };
  
  // Export analysis as PDF
  const exportPDF = async () => {
    if (!analysis) return;
    
    // Determine currency
    const pdfCurr = analysis.symbol.includes('.NS') || analysis.symbol.includes('.BO') ? '₹' : '$';
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(`${analysis.symbol} Analysis Report`, pageWidth / 2, 20, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${analysis.name}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`${analysis.sector} | ${analysis.industry}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
      
      // Divider
      doc.setLineWidth(0.5);
      doc.line(20, 45, pageWidth - 20, 45);
      
      let yPos = 55;
      
      // Valuation Summary
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Valuation Summary', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Recommendation: ${analysis.recommendation.replace('_', ' ')}`, 20, yPos);
      yPos += 7;
      doc.text(`Current Price: ${formatCurrency(analysis.currentPrice, pdfCurr)}`, 20, yPos);
      yPos += 7;
      doc.text(`Fair Value: ${formatCurrency(analysis.fairValue, pdfCurr)}`, 20, yPos);
      yPos += 7;
      doc.text(`Upside: ${analysis.upside >= 0 ? '+' : ''}${formatPercent(analysis.upside)}`, 20, yPos);
      yPos += 7;
      doc.text(`Margin of Safety: ${formatPercent(analysis.marginOfSafety)}`, 20, yPos);
      yPos += 15;
      
      // Valuation Models
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Valuation Models', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`DCF Fair Value: ${formatCurrency(analysis.dcf.intrinsicPrice, pdfCurr)}`, 20, yPos);
      yPos += 7;
      doc.text(`Earnings Multiple Fair Value: ${formatCurrency(analysis.earningsMultiple.fairValue, pdfCurr)}`, 20, yPos);
      yPos += 7;
      if (analysis.grahamNumber && analysis.grahamNumber.grahamNumber > 0) {
        doc.text(`Graham Number: ${formatCurrency(analysis.grahamNumber.grahamNumber, pdfCurr)}`, 20, yPos);
        yPos += 7;
      }
      yPos += 8;
      
      // Scores
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Analysis Scores', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fundamental Score: ${analysis.fundamentalScore.score}/100`, 20, yPos);
      yPos += 7;
      doc.text(`Technical Score: ${analysis.technicalScore.score}/100`, 20, yPos);
      yPos += 7;
      doc.text(`Confidence Score: ${analysis.confidenceScore.score}/100`, 20, yPos);
      yPos += 15;
      
      // Buy Zone
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Buy Zone', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Strong Buy: Below ${formatCurrency(analysis.buyZone.low, pdfCurr)}`, 20, yPos);
      yPos += 7;
      doc.text(`Buy: Below ${formatCurrency(analysis.buyZone.high, pdfCurr)}`, 20, yPos);
      yPos += 15;
      
      // Risk Factors
      if (analysis.riskFactors.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Risk Factors', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        analysis.riskFactors.slice(0, 5).forEach((risk) => {
          doc.text(`• ${risk.description} (${risk.severity})`, 20, yPos);
          yPos += 7;
        });
      }
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by Stock Valuator - For informational purposes only', pageWidth / 2, 285, { align: 'center' });
      
      // Save PDF
      doc.save(`${analysis.symbol}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Debounced search for autocomplete
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setSymbol(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If query is too short, hide dropdown
    if (value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        if (data.success && data.results.length > 0) {
          setSearchResults(data.results);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // Handle selecting a stock from dropdown
  const handleSelectStock = (selectedSymbol: string) => {
    // Keep the full symbol including exchange suffix (e.g., RELIANCE.NS)
    setSymbol(selectedSymbol);
    setSearchQuery(selectedSymbol);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    
    // Check usage limits for non-admin users
    if (session && usage.remaining <= 0 && usage.limit !== Infinity) {
      setError(`You've reached your daily limit of ${usage.limit} analyses. Upgrade to get more!`);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsApiKey(false);
    setShowDropdown(false);

    // Use the symbol as-is (already includes exchange suffix like .NS if selected from dropdown)
    const fullSymbol = symbol.trim().toUpperCase();

    try {
      const response = await fetch(`/api/analyze?symbol=${encodeURIComponent(fullSymbol)}`);
      const data = await response.json();

      if (!data.success) {
        if (data.needsApiKey) {
          setNeedsApiKey(true);
        }
        setError(data.error || 'Failed to analyze stock');
        return;
      }

      setAnalysis(data.data);
      
      // Increment usage count for logged-in users
      if (session) {
        try {
          await fetch('/api/usage', { method: 'POST' });
          await fetchUsage(); // Refresh usage count
        } catch (err) {
          console.error('Failed to update usage:', err);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Stock Valuator</h1>
                <p className="text-xs text-slate-400">Professional-grade analysis</p>
              </div>
            </div>

            {/* Search Form - Unified Search for US & India */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Symbol Input with Autocomplete */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin z-10"></div>
                )}
                <input
                  type="text"
                  value={searchQuery || symbol}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Search stocks... (Apple, Reliance)"
                  className="w-full sm:w-72 md:w-80 pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  maxLength={50}
                  autoComplete="off"
                />
                
                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((result: any, idx: number) => (
                      <button
                        key={result.symbol}
                        type="button"
                        onClick={() => handleSelectStock(result.symbol)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                          idx !== searchResults.length - 1 ? 'border-b border-slate-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Flag */}
                          <span className="text-lg">{result.flag || '🇺🇸'}</span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-mono font-bold">{result.symbol}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                result.market === 'NSE' 
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {result.market || 'US'}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm truncate mt-0.5">{result.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <button
                type="submit"
                disabled={loading || !symbol.trim()}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </form>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse"></div>
              ) : session ? (
                <div className="flex items-center gap-2">
                  {/* Usage Counter */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg" title={`Daily analyses: ${usage.used}/${usage.limit === Infinity ? '∞' : usage.limit}`}>
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">
                      {usage.limit === Infinity ? (
                        <span className="text-emerald-400 font-semibold">∞</span>
                      ) : (
                        <>
                          <span className={usage.remaining <= 2 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                            {usage.remaining}
                          </span>
                          <span className="text-slate-500">/{usage.limit}</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="text-sm text-slate-300 hidden sm:inline hover:text-white transition-colors"
                    title="My Profile"
                  >
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </Link>
                  <button
                    onClick={() => setShowWatchlist(!showWatchlist)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative"
                    title="My Watchlist"
                  >
                    <Star className={`w-4 h-4 ${watchlist.length > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    <span className="hidden sm:inline">Watchlist</span>
                    {watchlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                        {watchlist.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Screener Link */}
                  <Link
                    href="/screener"
                    className="flex items-center gap-1 px-3 py-2 text-sm text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-lg transition-colors"
                    title="Stock Screener"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Screener</span>
                  </Link>
                  
                  {/* Portfolio Link */}
                  <Link
                    href="/portfolio"
                    className="flex items-center gap-1 px-3 py-2 text-sm text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                    title="Portfolio Tracker"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Portfolio</span>
                  </Link>
                  
                  {/* Admin Link */}
                  {(session?.user as { tier?: string })?.tier === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-3 py-2 text-sm text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
                      title="Admin Dashboard"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Watchlist Slide-over Panel */}
      {showWatchlist && session && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWatchlist(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-800 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  My Watchlist
                </h2>
                <button
                  onClick={() => setShowWatchlist(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {watchlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Your watchlist is empty</p>
                    <p className="text-slate-500 text-sm mt-2">Search for stocks and add them to your watchlist</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watchlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
                      >
                        <button
                          onClick={() => {
                            setSymbol(item.symbol);
                            setSearchQuery(item.symbol);
                            setShowWatchlist(false);
                            // Trigger search
                            handleSearch({ preventDefault: () => {} } as React.FormEvent);
                          }}
                          className="flex-1 text-left"
                        >
                          <p className="font-semibold text-white">{item.symbol}</p>
                          <p className="text-slate-400 text-sm truncate">{item.name}</p>
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.symbol)}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Remove from watchlist"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <p className="text-slate-400 text-sm text-center">
                  {watchlist.length} / {(session?.user as { tier?: string })?.tier === 'admin' ? '∞' : '10'} stocks
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className={`rounded-lg p-6 ${needsApiKey ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-start gap-4">
              <AlertTriangle className={`w-6 h-6 mt-0.5 ${needsApiKey ? 'text-amber-400' : 'text-red-400'}`} />
              <div className="flex-1">
                <p className={`font-semibold ${needsApiKey ? 'text-amber-300' : 'text-red-300'}`}>
                  {needsApiKey ? 'API Key Required' : 'Analysis Error'}
                </p>
                <p className={`mt-1 ${needsApiKey ? 'text-amber-200' : 'text-red-200'}`}>{error}</p>
                
                {needsApiKey && (
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-white font-semibold mb-2">Quick Setup (2 minutes):</p>
                    <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                      <li>
                        Go to{' '}
                        <a 
                          href="https://financialmodelingprep.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          financialmodelingprep.com
                        </a>
                        {' '}and sign up for a free account
                      </li>
                      <li>Copy your API key from the dashboard</li>
                      <li>
                        Create a file named <code className="bg-slate-700 px-2 py-0.5 rounded text-emerald-300">.env.local</code> in the project root
                      </li>
                      <li>
                        Add: <code className="bg-slate-700 px-2 py-0.5 rounded text-emerald-300">FMP_API_KEY=your_key_here</code>
                      </li>
                      <li>Restart the dev server (Ctrl+C, then npm run dev)</li>
                    </ol>
                    <p className="mt-3 text-slate-400 text-xs">
                      The free tier allows 250 API calls/day - plenty for personal use!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {analysis && (() => {
        // Get currency symbol based on the stock symbol
        const currencyInfo = getCurrencyForSymbol(analysis.symbol);
        const curr = currencyInfo.symbol;
        
        return (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl p-8 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-3xl font-bold text-white">{analysis.symbol}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getValuationColor(analysis.recommendation)}`}>
                    {getValuationLabel(analysis.recommendation)}
                  </span>
                  {session && (
                    <>
                      <button
                        onClick={isInWatchlist(analysis.symbol) ? () => removeFromWatchlist(analysis.symbol) : addToWatchlist}
                        disabled={watchlistLoading}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                          isInWatchlist(analysis.symbol)
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-slate-600/50 text-slate-300 hover:bg-yellow-500/20 hover:text-yellow-400'
                        }`}
                        title={isInWatchlist(analysis.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star className={`w-4 h-4 ${isInWatchlist(analysis.symbol) ? 'fill-current' : ''}`} />
                        {watchlistLoading ? 'Saving...' : isInWatchlist(analysis.symbol) ? 'Saved' : 'Watch'}
                      </button>
                      <button
                        onClick={saveAnalysis}
                        disabled={savingAnalysis}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                          analysisSaved
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-600/50 text-slate-300 hover:bg-blue-500/20 hover:text-blue-400'
                        }`}
                        title="Save Analysis Report"
                      >
                        {analysisSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {savingAnalysis ? 'Saving...' : analysisSaved ? 'Saved!' : 'Save'}
                      </button>
                      <button
                        onClick={fetchAiAnalysis}
                        disabled={aiLoading}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30"
                        title="Get AI-Powered Analysis"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {aiLoading ? 'Analyzing...' : 'AI Insights'}
                      </button>
                      <button
                        onClick={fetchPeers}
                        disabled={peersLoading}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30"
                        title="Compare with Sector Peers"
                      >
                        {peersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                        {peersLoading ? 'Loading...' : 'Peers'}
                      </button>
                      <button
                        onClick={() => fetchHistoricalData()}
                        disabled={historicalLoading}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30"
                        title="View Historical Valuation"
                      >
                        {historicalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LineChart className="w-4 h-4" />}
                        {historicalLoading ? 'Loading...' : 'History'}
                      </button>
                      <button
                        onClick={exportPDF}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30"
                        title="Export as PDF"
                      >
                        <FileDown className="w-4 h-4" />
                        PDF
                      </button>
                    </>
                  )}
                </div>
                <p className="text-slate-300 text-lg">{analysis.name}</p>
                <p className="text-slate-400">{analysis.sector} • {analysis.industry}</p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(analysis.currentPrice, curr)}</p>
                  <p className={`text-sm ${analysis.quote.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analysis.quote.change >= 0 ? '+' : ''}{formatCurrency(analysis.quote.change, curr)} ({formatPercent(analysis.quote.changePercent / 100)})
                  </p>
                </div>

                <div className="w-px h-16 bg-slate-600"></div>

                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Fair Value</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatCurrency(analysis.fairValue, curr)}</p>
                  <p className={`text-sm ${analysis.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analysis.upside >= 0 ? '+' : ''}{formatPercent(analysis.upside)} upside
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl">
              <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>
          </section>

          {/* Score Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fundamental Score */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Fundamental Score</h3>
              </div>
              <p className={`text-4xl font-bold ${getScoreColor(analysis.fundamentalScore.score)}`}>
                {analysis.fundamentalScore.score}
              </p>
              <p className="text-slate-400 text-sm mt-1">out of 100</p>
            </div>

            {/* Technical Score */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Technical Score</h3>
              </div>
              <p className={`text-4xl font-bold ${getScoreColor(analysis.technicalScore.score)}`}>
                {analysis.technicalScore.score}
              </p>
              <p className="text-slate-400 text-sm mt-1">out of 100</p>
            </div>

            {/* Confidence Score */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">Confidence</h3>
              </div>
              <p className={`text-4xl font-bold ${getScoreColor(analysis.confidenceScore.score)}`}>
                {analysis.confidenceScore.score}
              </p>
              <p className="text-slate-400 text-sm mt-1">out of 100</p>
            </div>

            {/* Margin of Safety */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Margin of Safety</h3>
              </div>
              <p className={`text-4xl font-bold ${analysis.marginOfSafety >= 0.25 ? 'text-emerald-400' : analysis.marginOfSafety >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {formatPercent(analysis.marginOfSafety)}
              </p>
              <p className="text-slate-400 text-sm mt-1">{analysis.marginOfSafety >= 0.25 ? 'Strong buffer' : analysis.marginOfSafety >= 0 ? 'Some buffer' : 'Overvalued'}</p>
            </div>
          </section>

          {/* AI Analysis Panel */}
          {showAiPanel && (
            <section className="bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI-Powered Analysis</h3>
                    <p className="text-purple-200/60 text-sm">Powered by Google Gemini</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {aiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-purple-200">Analyzing {analysis.symbol}...</p>
                    <p className="text-purple-300/60 text-sm mt-2">This may take a few seconds</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="bg-slate-900/50 rounded-lg p-6 text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {aiSummary.split('\n').map((line, i) => {
                      // Handle headers
                      if (line.startsWith('## ')) {
                        return <h3 key={i} className="text-lg font-bold text-purple-300 mt-4 mb-2">{line.replace('## ', '')}</h3>;
                      }
                      if (line.startsWith('# ')) {
                        return <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2">{line.replace('# ', '')}</h2>;
                      }
                      // Handle bullet points
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return <p key={i} className="ml-4 text-slate-300">{line}</p>;
                      }
                      // Handle bold text
                      if (line.includes('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={i} className="text-slate-300">
                            {parts.map((part, j) => 
                              j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      // Handle horizontal rules
                      if (line.startsWith('---')) {
                        return <hr key={i} className="border-purple-500/30 my-4" />;
                      }
                      // Handle italics (disclaimer)
                      if (line.startsWith('*') && line.endsWith('*')) {
                        return <p key={i} className="text-slate-500 text-sm italic mt-4">{line.replace(/\*/g, '')}</p>;
                      }
                      // Regular text
                      if (line.trim()) {
                        return <p key={i} className="text-slate-300">{line}</p>;
                      }
                      return <br key={i} />;
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-purple-300/60 text-xs">
                  AI analysis is for informational purposes only and not investment advice.
                </p>
                <button
                  onClick={fetchAiAnalysis}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 text-purple-300 rounded-lg hover:bg-purple-600/50 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </section>
          )}

          {/* Peer Comparison Panel */}
          {showPeers && (
            <section className="bg-gradient-to-r from-cyan-900/30 via-blue-900/20 to-cyan-900/30 rounded-xl p-6 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Peer Comparison</h3>
                    <p className="text-cyan-200/60 text-sm">{analysis.sector} Sector</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPeers(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {peersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-cyan-200">Loading peer data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Your Stock vs Sector Averages */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Your P/E</p>
                      <p className={`text-xl font-bold ${analysis.quote.pe < peerAverages.pe ? 'text-emerald-400' : 'text-red-400'}`}>
                        {analysis.quote.pe?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-slate-500 text-xs">Avg: {peerAverages.pe.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Your Fwd P/E</p>
                      <p className={`text-xl font-bold ${analysis.quote.forwardPE < peerAverages.forwardPE ? 'text-emerald-400' : 'text-red-400'}`}>
                        {analysis.quote.forwardPE?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-slate-500 text-xs">Avg: {peerAverages.forwardPE.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Your Div Yield</p>
                      <p className={`text-xl font-bold ${analysis.quote.dividendYield > peerAverages.dividendYield ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {((analysis.quote.dividendYield || 0) * 100).toFixed(2)}%
                      </p>
                      <p className="text-slate-500 text-xs">Avg: {(peerAverages.dividendYield * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Verdict</p>
                      <p className={`text-xl font-bold ${analysis.quote.pe < peerAverages.pe ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {analysis.quote.pe < peerAverages.pe ? 'Cheaper' : 'Pricier'}
                      </p>
                      <p className="text-slate-500 text-xs">vs peers</p>
                    </div>
                  </div>
                  
                  {/* Peer Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-cyan-500/30">
                          <th className="text-left py-3 px-4 text-cyan-300">Company</th>
                          <th className="text-right py-3 px-4 text-cyan-300">Price</th>
                          <th className="text-right py-3 px-4 text-cyan-300">Change</th>
                          <th className="text-right py-3 px-4 text-cyan-300">P/E</th>
                          <th className="text-right py-3 px-4 text-cyan-300">Fwd P/E</th>
                          <th className="text-right py-3 px-4 text-cyan-300">Market Cap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Current Stock Row */}
                        <tr className="border-b border-cyan-500/20 bg-cyan-500/10">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{analysis.symbol}</div>
                            <div className="text-slate-400 text-xs truncate max-w-[150px]">{analysis.name}</div>
                          </td>
                          <td className="text-right py-3 px-4 text-white font-mono">{formatCurrency(analysis.currentPrice, curr)}</td>
                          <td className={`text-right py-3 px-4 font-mono ${analysis.quote.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {analysis.quote.changePercent >= 0 ? '+' : ''}{analysis.quote.changePercent.toFixed(2)}%
                          </td>
                          <td className="text-right py-3 px-4 text-white font-mono">{analysis.quote.pe?.toFixed(1) || 'N/A'}</td>
                          <td className="text-right py-3 px-4 text-white font-mono">{analysis.quote.forwardPE?.toFixed(1) || 'N/A'}</td>
                          <td className="text-right py-3 px-4 text-white font-mono">{formatLargeCurrency(analysis.quote.marketCap, curr)}</td>
                        </tr>
                        {/* Peer Rows */}
                        {peers.map((peer) => (
                          <tr key={peer.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-200">{peer.symbol}</div>
                              <div className="text-slate-400 text-xs truncate max-w-[150px]">{peer.name}</div>
                            </td>
                            <td className="text-right py-3 px-4 text-slate-300 font-mono">{formatCurrency(peer.price, curr)}</td>
                            <td className={`text-right py-3 px-4 font-mono ${peer.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {peer.changePercent >= 0 ? '+' : ''}{peer.changePercent.toFixed(2)}%
                            </td>
                            <td className={`text-right py-3 px-4 font-mono ${peer.pe < analysis.quote.pe ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {peer.pe?.toFixed(1) || 'N/A'}
                            </td>
                            <td className={`text-right py-3 px-4 font-mono ${peer.forwardPE < analysis.quote.forwardPE ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {peer.forwardPE?.toFixed(1) || 'N/A'}
                            </td>
                            <td className="text-right py-3 px-4 text-slate-300 font-mono">{formatLargeCurrency(peer.marketCap, curr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {peers.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No peer data available for this sector
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Historical Valuation Chart Panel */}
          {showHistorical && (
            <section className="bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Historical Valuation</h3>
                    <p className="text-green-200/60 text-sm">Price vs Fair Value over time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Period Selector */}
                  <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1">
                    {['1m', '3m', '6m', '1y', '2y'].map((period) => (
                      <button
                        key={period}
                        onClick={() => fetchHistoricalData(period)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          historicalPeriod === period
                            ? 'bg-green-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {period.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowHistorical(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              {historicalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto mb-4" />
                    <p className="text-green-200">Loading historical data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Current Price</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(analysis.currentPrice, curr)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Avg Price</p>
                      <p className="text-xl font-bold text-slate-300">{formatCurrency(historicalStats.avgPrice, curr)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Fair Value</p>
                      <p className="text-xl font-bold text-emerald-400">{formatCurrency(analysis.fairValue, curr)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm mb-1">Status</p>
                      <p className={`text-lg font-bold ${
                        historicalStats.valuationStatus.includes('Under') ? 'text-emerald-400' :
                        historicalStats.valuationStatus.includes('Over') ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {historicalStats.valuationStatus || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Simple Chart Representation (without Recharts for now - using CSS bars) */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-end gap-1 h-48 overflow-x-auto">
                      {historicalData.slice(-50).map((point, i) => {
                        const maxPrice = Math.max(...historicalData.slice(-50).map(d => d.price));
                        const height = (point.price / maxPrice) * 100;
                        const fairValueHeight = point.fairValue ? (point.fairValue / maxPrice) * 100 : 0;
                        const isAboveFairValue = point.fairValue ? point.price > point.fairValue : false;
                        
                        return (
                          <div key={i} className="flex-1 min-w-[6px] flex flex-col justify-end relative group">
                            {/* Fair Value indicator */}
                            {fairValueHeight > 0 && (
                              <div 
                                className="absolute w-full bg-emerald-500/30 border-t-2 border-emerald-400"
                                style={{ height: `${fairValueHeight}%`, bottom: 0 }}
                              />
                            )}
                            {/* Price bar */}
                            <div 
                              className={`w-full rounded-t transition-all ${
                                isAboveFairValue ? 'bg-red-400/70' : 'bg-emerald-400/70'
                              } hover:opacity-100 opacity-80`}
                              style={{ height: `${height}%` }}
                              title={`${point.date}: ${formatCurrency(point.price, curr)}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>{historicalData[0]?.date || ''}</span>
                      <span>{historicalData[historicalData.length - 1]?.date || ''}</span>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-400/70"></div>
                      <span className="text-slate-400">Below Fair Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-400/70"></div>
                      <span className="text-slate-400">Above Fair Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-emerald-400"></div>
                      <span className="text-slate-400">Fair Value Line</span>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Valuation Models */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DCF Valuation */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">DCF Valuation</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">DCF Fair Value</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(analysis.dcf.intrinsicPrice, curr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Discount Rate (WACC)</span>
                  <span className="text-white">{formatPercent(analysis.dcf.wacc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Enterprise Value</span>
                  <span className="text-white">{formatLargeCurrency(analysis.dcf.enterpriseValue, curr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Upside to DCF Value</span>
                  <span className={analysis.dcf.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {analysis.dcf.upside >= 0 ? '+' : ''}{formatPercent(analysis.dcf.upside)}
                  </span>
                </div>
              </div>
            </div>

            {/* Earnings Multiple */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Earnings Multiple</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">P/E Fair Value</span>
                  <span className="text-xl font-bold text-purple-400">{formatCurrency(analysis.earningsMultiple.fairValue, curr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Selected P/E</span>
                  <span className="text-white">{analysis.earningsMultiple.selectedPE.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Forward EPS</span>
                  <span className="text-white">{formatCurrency(analysis.earningsMultiple.forwardEps, curr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Historical P/E Range</span>
                  <span className="text-white">{analysis.earningsMultiple.historicalPELow.toFixed(0)}x - {analysis.earningsMultiple.historicalPEHigh.toFixed(0)}x</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reverse DCF & Buy Zone */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reverse DCF */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <Info className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Reverse DCF Analysis</h3>
              </div>
              
              <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
                <p className="text-slate-300">{analysis.reverseDCF.assessment}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Implied Growth:</span>
                <span className={`text-lg font-semibold ${analysis.reverseDCF.isReasonable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(analysis.reverseDCF.impliedGrowthRate)}
                </span>
                {analysis.reverseDCF.isReasonable ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>

            {/* Buy Zone */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">Buy Zone</h3>
              </div>
              
              <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden mb-6">
                {/* Buy zone highlight */}
                <div 
                  className="absolute h-full bg-emerald-500/30"
                  style={{
                    left: `${(analysis.buyZone.low / analysis.fairValue) * 50}%`,
                    width: `${((analysis.buyZone.high - analysis.buyZone.low) / analysis.fairValue) * 50}%`,
                  }}
                />
                {/* Current price marker */}
                <div 
                  className="absolute top-0 w-1 h-full bg-white"
                  style={{
                    left: `${Math.min(90, (analysis.currentPrice / analysis.fairValue) * 50)}%`,
                  }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-slate-400 text-sm">Strong Buy</p>
                  <p className="text-emerald-400 font-bold">&lt; {formatCurrency(analysis.buyZone.low, curr)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Buy</p>
                  <p className="text-green-400 font-bold">&lt; {formatCurrency(analysis.buyZone.high, curr)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Fair Value</p>
                  <p className="text-blue-400 font-bold">{formatCurrency(analysis.fairValue, curr)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Graham Number Section */}
          {analysis.grahamNumber && analysis.grahamNumber.grahamNumber > 0 && (
            <section className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 rounded-xl p-6 border border-amber-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Graham Number</h3>
                  <p className="text-amber-200/60 text-sm">Benjamin Graham&apos;s Formula: √(22.5 × EPS × Book Value)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Graham Number</p>
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(analysis.grahamNumber.grahamNumber, curr)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(analysis.grahamNumber.currentPrice, curr)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Upside to Graham</p>
                  <p className={`text-2xl font-bold ${analysis.grahamNumber.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analysis.grahamNumber.upside >= 0 ? '+' : ''}{formatPercent(analysis.grahamNumber.upside)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{
                backgroundColor: analysis.grahamNumber.isBelowGraham ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              }}>
                {analysis.grahamNumber.isBelowGraham ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                )}
                <p className={analysis.grahamNumber.isBelowGraham ? 'text-emerald-300' : 'text-red-300'}>
                  {analysis.grahamNumber.isBelowGraham 
                    ? `Stock is trading below Graham Number - potential value opportunity!`
                    : `Stock is trading above Graham Number by ${formatPercent(Math.abs(analysis.grahamNumber.upside))}`
                  }
                </p>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">EPS (TTM)</span>
                  <span className="text-white">{formatCurrency(analysis.grahamNumber.eps, curr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Book Value/Share</span>
                  <span className="text-white">{formatCurrency(analysis.grahamNumber.bookValuePerShare, curr)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Risk Factors */}
          {analysis.riskFactors.length > 0 && (
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Risk Factors</h3>
              </div>
              
              <div className="space-y-3">
                {analysis.riskFactors.map((risk, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-lg flex items-center gap-4 ${
                      risk.severity === 'high' ? 'bg-red-500/10 border border-red-500/30' :
                      risk.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' :
                      'bg-slate-700/30 border border-slate-600/30'
                    }`}
                  >
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      risk.severity === 'high' ? 'bg-red-500 text-white' :
                      risk.severity === 'medium' ? 'bg-amber-500 text-black' :
                      'bg-slate-500 text-white'
                    }`}>
                      {risk.severity}
                    </span>
                    <span className="text-slate-300">{risk.description}</span>
                    <span className="text-slate-500 text-sm ml-auto">{risk.category}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Metrics Table */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Key Metrics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Market Cap</p>
                <p className="text-white font-semibold">{formatLargeCurrency(analysis.quote.marketCap, curr)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">P/E Ratio</p>
                <p className="text-white font-semibold">{analysis.quote.pe.toFixed(1)}x</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Forward P/E</p>
                <p className="text-white font-semibold">{analysis.quote.forwardPE.toFixed(1)}x</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Beta</p>
                <p className="text-white font-semibold">{analysis.quote.beta.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">52W High</p>
                <p className="text-white font-semibold">{formatCurrency(analysis.quote.fiftyTwoWeekHigh, curr)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">52W Low</p>
                <p className="text-white font-semibold">{formatCurrency(analysis.quote.fiftyTwoWeekLow, curr)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Dividend Yield</p>
                <p className="text-white font-semibold">{formatPercent(analysis.quote.dividendYield)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">EPS (TTM)</p>
                <p className="text-white font-semibold">{formatCurrency(analysis.quote.eps, curr)}</p>
              </div>
            </div>
          </section>

          {/* Valuation Summary Table */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">📊 Valuation Summary</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="py-3 px-4 text-slate-400 font-medium">Metric</th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Stock Name</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{analysis.name}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Current Price</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{formatCurrency(analysis.currentPrice, curr)}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">EPS (TTM)</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{formatCurrency(analysis.quote.eps, curr)}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Forward EPS</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{formatCurrency(analysis.quote.forwardEps, curr)}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">P/E Ratio</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{analysis.quote.pe.toFixed(2)}x</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Forward P/E</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">{analysis.quote.forwardPE.toFixed(2)}x</td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Expected Growth Rate</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold text-right">
                      {formatPercent(analysis.reverseDCF.impliedGrowthRate)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Conservative Growth Rate</td>
                    <td className="py-3 px-4 text-white font-semibold text-right">
                      {formatPercent(Math.min(analysis.reverseDCF.impliedGrowthRate * 0.7, 0.15))}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Margin of Safety</td>
                    <td className={`py-3 px-4 font-semibold text-right ${analysis.marginOfSafety >= 0.20 ? 'text-emerald-400' : analysis.marginOfSafety >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {formatPercent(analysis.marginOfSafety)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30 bg-slate-700/20">
                    <td className="py-3 px-4 text-slate-300 font-medium">Intrinsic Value (DCF)</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold text-right text-lg">
                      {formatCurrency(analysis.dcf.intrinsicPrice, curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">Earnings Multiple Fair Value</td>
                    <td className="py-3 px-4 text-purple-400 font-semibold text-right">
                      {formatCurrency(analysis.earningsMultiple.fairValue, curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30 bg-emerald-500/10">
                    <td className="py-3 px-4 text-white font-medium">Weighted Fair Value</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold text-right text-lg">
                      {formatCurrency(analysis.fairValue, curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30 bg-blue-500/10">
                    <td className="py-3 px-4 text-white font-medium">Right Price (25% MoS)</td>
                    <td className="py-3 px-4 text-blue-400 font-bold text-right text-lg">
                      {formatCurrency(analysis.buyZone.high, curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30 bg-teal-500/10">
                    <td className="py-3 px-4 text-white font-medium">Strong Buy Price (35% MoS)</td>
                    <td className="py-3 px-4 text-teal-400 font-bold text-right text-lg">
                      {formatCurrency(analysis.buyZone.low, curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">5-Year Price Target</td>
                    <td className="py-3 px-4 text-amber-400 font-semibold text-right">
                      {formatCurrency(analysis.currentPrice * Math.pow(1 + Math.min(analysis.reverseDCF.impliedGrowthRate, 0.15), 5), curr)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">10-Year Price Target</td>
                    <td className="py-3 px-4 text-amber-400 font-semibold text-right">
                      {formatCurrency(analysis.currentPrice * Math.pow(1 + Math.min(analysis.reverseDCF.impliedGrowthRate * 0.8, 0.12), 10), curr)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Historical Financial Data */}
          {analysis.financials && analysis.financials.income.length > 0 && (
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Historical Financial Data (Past Years)</h3>
              
              {/* Currency Warning for ADRs */}
              {(() => {
                const currencyInfo = getCurrencyForSymbol(analysis.symbol, exchange);
                if (currencyInfo.isADR || exchange !== '') {
                  return (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-300 text-sm">
                        <span className="font-semibold">⚠️ Currency Note:</span> Financial data is reported in <span className="font-bold">{currencyInfo.name}</span> ({currencyInfo.symbol}), not USD. 
                        Values shown are in the company's reporting currency.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="py-3 px-3 text-slate-400 font-medium">Year</th>
                      <th className="py-3 px-3 text-slate-400 font-medium text-right">Revenue</th>
                      <th className="py-3 px-3 text-slate-400 font-medium text-right">Net Income</th>
                      <th className="py-3 px-3 text-slate-400 font-medium text-right">Net Margin</th>
                      <th className="py-3 px-3 text-slate-400 font-medium text-right">YoY Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {analysis.financials.income.slice(0, 10).map((income: any, idx: number) => {
                      const prevRevenue = analysis.financials.income[idx + 1]?.revenue;
                      const growth = prevRevenue ? (income.revenue - prevRevenue) / prevRevenue : 0;
                      const currencyInfo = getCurrencyForSymbol(analysis.symbol, exchange);
                      return (
                        <tr key={income.fiscalYear} className="hover:bg-slate-700/30">
                          <td className="py-3 px-3 text-white font-medium">{income.fiscalYear}</td>
                          <td className="py-3 px-3 text-slate-300 text-right">{formatLargeCurrency(income.revenue, currencyInfo.symbol)}</td>
                          <td className="py-3 px-3 text-slate-300 text-right">{formatLargeCurrency(income.netIncome, currencyInfo.symbol)}</td>
                          <td className="py-3 px-3 text-slate-300 text-right">{formatPercent(income.netIncomeMargin)}</td>
                          <td className={`py-3 px-3 text-right font-medium ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {idx < analysis.financials.income.length - 1 ? (growth >= 0 ? '+' : '') + formatPercent(growth) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Future Projections */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">🔮 Future Projections (Next 10 Years)</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="py-3 px-3 text-slate-400 font-medium">Year</th>
                    <th className="py-3 px-3 text-slate-400 font-medium text-right">Projected EPS</th>
                    <th className="py-3 px-3 text-slate-400 font-medium text-right">Projected Price</th>
                    <th className="py-3 px-3 text-slate-400 font-medium text-right">Growth from Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
                    const currentYear = new Date().getFullYear();
                    // Use conservative growth rate that decays over time
                    const baseGrowth = Math.min(analysis.reverseDCF.impliedGrowthRate * 0.7, 0.15);
                    const decayedGrowth = baseGrowth * Math.pow(0.95, year - 1);
                    const cumulativeGrowth = Math.pow(1 + decayedGrowth, year);
                    const projectedEPS = analysis.quote.eps * cumulativeGrowth;
                    const projectedPrice = analysis.currentPrice * cumulativeGrowth;
                    const totalGrowth = cumulativeGrowth - 1;
                    
                    return (
                      <tr key={year} className={`hover:bg-slate-700/30 ${year === 5 || year === 10 ? 'bg-slate-700/20' : ''}`}>
                        <td className="py-3 px-3 text-white font-medium">{currentYear + year}</td>
                        <td className="py-3 px-3 text-slate-300 text-right">{formatCurrency(projectedEPS, curr)}</td>
                        <td className="py-3 px-3 text-emerald-400 text-right font-medium">{formatCurrency(projectedPrice, curr)}</td>
                        <td className="py-3 px-3 text-blue-400 text-right">+{formatPercent(totalGrowth)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">
                <span className="text-amber-400">⚠️ Note:</span> Projections use a conservative growth rate of{' '}
                <span className="text-white font-medium">
                  {formatPercent(Math.min(analysis.reverseDCF.impliedGrowthRate * 0.7, 0.15))}
                </span>{' '}
                with yearly decay. Actual results may vary significantly. This is not financial advice.
              </p>
            </div>
          </section>

          {/* CGR Analysis */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">📉 Compound Growth Rate (CGR) Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm mb-2">Implied Growth Rate</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatPercent(analysis.reverseDCF.impliedGrowthRate)}
                </p>
                <p className="text-slate-500 text-xs mt-1">Based on current valuation</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm mb-2">Conservative CGR (5Y)</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatPercent(Math.min(analysis.reverseDCF.impliedGrowthRate * 0.7, 0.12))}
                </p>
                <p className="text-slate-500 text-xs mt-1">30% haircut applied</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm mb-2">Terminal Growth Rate</p>
                <p className="text-2xl font-bold text-purple-400">
                  3.0%
                </p>
                <p className="text-slate-500 text-xs mt-1">Long-term GDP growth</p>
              </div>
            </div>
            
            {analysis.financials && analysis.financials.income.length >= 2 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Revenue CAGR (Historical)</p>
                  <p className="text-xl font-bold text-white">
                    {(() => {
                      const years = analysis.financials.income.length;
                      if (years < 2) return 'N/A';
                      const latestRev = analysis.financials.income[0]?.revenue || 0;
                      const oldestRev = analysis.financials.income[years - 1]?.revenue || 0;
                      if (oldestRev <= 0) return 'N/A';
                      const cagr = Math.pow(latestRev / oldestRev, 1 / (years - 1)) - 1;
                      return formatPercent(cagr);
                    })()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Based on {analysis.financials.income.length} years of data</p>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Net Income CAGR (Historical)</p>
                  <p className="text-xl font-bold text-white">
                    {(() => {
                      const years = analysis.financials.income.length;
                      if (years < 2) return 'N/A';
                      const latestIncome = analysis.financials.income[0]?.netIncome || 0;
                      const oldestIncome = analysis.financials.income[years - 1]?.netIncome || 0;
                      if (oldestIncome <= 0 || latestIncome <= 0) return 'N/A';
                      const cagr = Math.pow(latestIncome / oldestIncome, 1 / (years - 1)) - 1;
                      return formatPercent(cagr);
                    })()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Based on {analysis.financials.income.length} years of data</p>
                </div>
              </div>
            )}
          </section>

          {/* Footer Note */}
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm">
              Analysis generated on {new Date(analysis.analysisDate).toLocaleDateString()} • 
              Data provided for informational purposes only • Not financial advice
            </p>
          </div>
        </main>
        );
      })()}

      {/* Empty State */}
      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Enter a Stock Symbol</h2>
          <p className="text-slate-400 max-w-md">
            Get comprehensive valuation analysis including DCF, earnings multiples, technical indicators, and more.
          </p>
        </div>
      )}

      {/* Footer Disclaimer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center mb-4">
            <p className="text-amber-400 text-xs font-semibold mb-2">⚠️ IMPORTANT DISCLAIMER</p>
            <p className="text-slate-400 text-xs max-w-4xl mx-auto leading-relaxed">
              This platform provides <strong>educational and informational content only</strong>. It is <strong>NOT investment advice</strong>. 
              All analysis, valuations, and projections are estimates based on publicly available data and may not reflect actual market conditions. 
              <strong> Past performance is not indicative of future results.</strong> Always conduct your own research and consult a qualified 
              SEBI-registered Investment Advisor before making investment decisions. We are <strong>NOT registered with SEBI</strong> as 
              Investment Advisors or Research Analysts. Use this tool at your own risk.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <span className="hidden sm:inline">•</span>
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <span className="hidden sm:inline">•</span>
            <span>© {new Date().getFullYear()} Stock Valuator. For educational purposes only.</span>
          </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-600 shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Important Disclaimer</h2>
                <p className="text-slate-400 mt-2">Please read and accept before continuing</p>
              </div>
              
              <div className="space-y-4 text-sm text-slate-300 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">1.</span>
                  <p><strong className="text-white">NOT INVESTMENT ADVICE:</strong> The information provided on this platform is for educational and informational purposes only. It should NOT be considered as investment advice, financial advice, or trading advice.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">2.</span>
                  <p><strong className="text-white">NO GUARANTEES:</strong> Past performance is not indicative of future results. All investments carry risk, and you may lose some or all of your investment.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">3.</span>
                  <p><strong className="text-white">DO YOUR OWN RESEARCH:</strong> Always conduct your own research and consult with a qualified SEBI-registered financial advisor before making any investment decisions.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">4.</span>
                  <p><strong className="text-white">DATA ACCURACY:</strong> While we strive for accuracy, we do not guarantee the completeness or accuracy of any information presented. Data is sourced from third-party providers.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">5.</span>
                  <p><strong className="text-white">NOT A REGISTERED ADVISOR:</strong> This platform and its operators are NOT registered with SEBI as Investment Advisors or Research Analysts.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">6.</span>
                  <p><strong className="text-white">USER RESPONSIBILITY:</strong> Any investment decisions made based on information from this platform are solely your responsibility.</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={acceptDisclaimer}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  I Understand and Accept
                </button>
                <p className="text-xs text-slate-500 text-center">
                  By clicking above, you acknowledge that you have read, understood, and agree to the terms stated.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
