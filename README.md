# Stock Valuator

Production-grade stock valuation and analysis tool built with Next.js.

## Features

### 📊 Valuation Models
- **DCF (Discounted Cash Flow)** - 20-year multi-phase model with terminal value
- **Earnings Multiple** - Conservative P/E-based valuation
- **Reverse DCF** - Implied growth rate analysis

### 📈 Technical Analysis
- SMA 50/200 crossover signals
- RSI (Relative Strength Index)
- MACD with histogram
- Support/Resistance levels
- Trend direction detection

### 🔍 Fundamental Analysis
- Return on Invested Capital (ROIC)
- Revenue & FCF growth trends
- Debt management metrics
- Profit margins
- Share dilution tracking

### 🎯 Output Metrics
- Fair Value (weighted average)
- Margin of Safety
- Buy Zone ranges
- Confidence Score (0-100)
- Risk factor identification
- Investment recommendation

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Charts**: Chart.js (ready to add)
- **Data Fetching**: SWR, Axios
- **Caching**: SQLite (in-memory)
- **Type Safety**: TypeScript

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Get API Key

Sign up for a free API key at [Financial Modeling Prep](https://financialmodelingprep.com/)

### 3. Configure Environment

Create a `.env.local` file:

```bash
FMP_API_KEY=your_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── analyze/         # Stock analysis API route
│   ├── page.tsx             # Main dashboard
│   └── layout.tsx           # Root layout
├── lib/
│   ├── api/
│   │   ├── fmp-client.ts    # Financial Modeling Prep client
│   │   └── stock-analysis.ts # Main analysis orchestrator
│   ├── valuation/
│   │   ├── dcf.ts           # DCF model
│   │   └── earnings-multiple.ts
│   ├── analysis/
│   │   ├── fundamental.ts   # Fundamental scoring
│   │   └── technical.ts     # Technical indicators
│   ├── cache/
│   │   └── cache-manager.ts # Caching layer
│   └── utils/
│       └── constants.ts     # Financial constants
├── types/
│   └── stock.ts             # TypeScript definitions
└── components/              # UI components (expandable)
```

## Valuation Methodology

### DCF Model
1. **Phase 1 (Years 1-5)**: Analyst growth estimates
2. **Phase 2 (Years 6-15)**: Linear decay to terminal rate
3. **Phase 3 (Years 16-20)**: Terminal growth rate (2.5%)

### WACC Calculation
```
WACC = Risk-Free Rate + Beta × (Market Return - Risk-Free Rate)
```

### Terminal Value
```
TV = FCF₂₀ × (1 + g) / (WACC - g)
```

### Intrinsic Value
```
Equity Value = Enterprise Value - Debt + Cash
Intrinsic Price = Equity Value / Shares Outstanding
```

## API Endpoints

### GET /api/analyze

Analyze a stock by symbol.

**Query Parameters:**
- `symbol` (required): Stock ticker symbol (e.g., AAPL)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "fairValue": 215.40,
    "currentPrice": 178.50,
    "marginOfSafety": 0.207,
    "recommendation": "BUY",
    // ... full analysis
  }
}
```

## Demo Mode

The app includes demo data for Apple (AAPL) that displays when no API key is configured or when no search is performed. This allows you to explore the UI without an API key.

## Roadmap

- [ ] Add Chart.js visualizations for projections
- [ ] Historical fundamentals graphs
- [ ] PDF/Excel export
- [ ] Portfolio analysis mode
- [ ] Watchlist support
- [ ] Redis caching for production
- [ ] Rate limiting
- [ ] Unit tests for valuation modules

## Disclaimer

This tool is for educational and informational purposes only. It is not financial advice. Always do your own research and consult with a financial advisor before making investment decisions.

## License

MIT
