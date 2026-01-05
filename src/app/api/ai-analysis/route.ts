import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - use env variable or fallback
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis } = body;

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analysis data required' }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        aiSummary: generateFallbackSummary(analysis),
        source: 'fallback',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional stock analyst. Analyze the following stock data and provide a concise, actionable investment summary.

STOCK: ${analysis.symbol} - ${analysis.name}
SECTOR: ${analysis.sector} | INDUSTRY: ${analysis.industry}

CURRENT METRICS:
- Current Price: $${analysis.currentPrice}
- Fair Value (DCF): $${analysis.dcf?.intrinsicPrice?.toFixed(2) || 'N/A'}
- Fair Value (Earnings Multiple): $${analysis.earningsMultiple?.fairValue?.toFixed(2) || 'N/A'}
- Weighted Fair Value: $${analysis.fairValue?.toFixed(2)}
- Upside Potential: ${(analysis.upside * 100).toFixed(1)}%
- Margin of Safety: ${(analysis.marginOfSafety * 100).toFixed(1)}%
${analysis.grahamNumber ? `- Graham Number: $${analysis.grahamNumber.grahamNumber?.toFixed(2)}` : ''}

VALUATION:
- P/E Ratio: ${analysis.quote?.pe?.toFixed(1) || 'N/A'}
- Forward P/E: ${analysis.quote?.forwardPE?.toFixed(1) || 'N/A'}
- EPS (TTM): $${analysis.quote?.eps?.toFixed(2) || 'N/A'}
- Dividend Yield: ${((analysis.quote?.dividendYield || 0) * 100).toFixed(2)}%

PRICE RANGE:
- 52-Week High: $${analysis.quote?.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
- 52-Week Low: $${analysis.quote?.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}
- Buy Zone: $${analysis.buyZone?.low?.toFixed(2)} - $${analysis.buyZone?.high?.toFixed(2)}

SCORES:
- Fundamental Score: ${analysis.fundamentalScore?.score || 'N/A'}/100
- Technical Score: ${analysis.technicalScore?.score || 'N/A'}/100
- Confidence Score: ${analysis.confidenceScore?.score || 'N/A'}/100

RECOMMENDATION: ${analysis.recommendation}

RISK FACTORS:
${analysis.riskFactors?.map((r: { description: string; severity: string }) => `- ${r.description} (${r.severity})`).join('\n') || 'None identified'}

Please provide:
1. **Investment Thesis** (2-3 sentences on why to consider/avoid this stock)
2. **Key Strengths** (3 bullet points)
3. **Key Risks** (3 bullet points)
4. **Fair Value Assessment** (Is it undervalued, fairly valued, or overvalued?)
5. **Action Recommendation** (What should an investor do? Be specific about entry points)

Keep the response concise and actionable. Use Indian Rupee (₹) for Indian stocks (.NS suffix).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      aiSummary: text,
      source: 'gemini',
    });
  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // Return fallback summary on error
    try {
      const body = await request.clone().json();
      return NextResponse.json({
        success: true,
        aiSummary: generateFallbackSummary(body.analysis),
        source: 'fallback',
        error: 'AI unavailable, using rule-based analysis',
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to generate AI analysis' }, { status: 500 });
    }
  }
}

// Fallback summary when API key is not available
function generateFallbackSummary(analysis: {
  symbol: string;
  name: string;
  recommendation: string;
  upside: number;
  marginOfSafety: number;
  fairValue: number;
  currentPrice: number;
  fundamentalScore?: { score: number };
  technicalScore?: { score: number };
  grahamNumber?: { isBelowGraham: boolean; grahamNumber: number };
  riskFactors?: Array<{ description: string }>;
}): string {
  const upside = (analysis.upside * 100).toFixed(1);
  const marginOfSafety = (analysis.marginOfSafety * 100).toFixed(1);
  
  let thesis = '';
  let action = '';
  
  switch (analysis.recommendation) {
    case 'STRONG_BUY':
      thesis = `${analysis.name} presents an exceptional value opportunity with ${upside}% upside potential. The stock is significantly undervalued compared to its intrinsic value.`;
      action = `Consider accumulating shares below $${analysis.fairValue?.toFixed(2)}. Dollar-cost averaging is recommended.`;
      break;
    case 'BUY':
      thesis = `${analysis.name} offers good value at current levels with ${upside}% upside. The stock trades below fair value with a reasonable margin of safety.`;
      action = `Consider building a position at current prices or on dips.`;
      break;
    case 'HOLD':
      thesis = `${analysis.name} is fairly valued at current prices. Risk/reward is balanced with limited upside potential.`;
      action = `Hold existing positions. Wait for better entry points below the buy zone.`;
      break;
    case 'AVOID':
      thesis = `${analysis.name} appears overvalued with negative upside potential. Current prices don't offer adequate margin of safety.`;
      action = `Avoid initiating new positions. Consider reducing exposure if held.`;
      break;
    case 'STRONG_AVOID':
      thesis = `${analysis.name} is significantly overvalued with substantial downside risk. The stock trades well above intrinsic value.`;
      action = `Avoid this stock. Consider exiting positions if held.`;
      break;
    default:
      thesis = `${analysis.name} requires further analysis to determine investment merit.`;
      action = `Wait for more data before making investment decisions.`;
  }

  const strengths = [];
  const risks = [];

  // Analyze strengths
  if (analysis.fundamentalScore && analysis.fundamentalScore.score >= 60) {
    strengths.push('Strong fundamental quality with solid financial metrics');
  }
  if (analysis.technicalScore && analysis.technicalScore.score >= 60) {
    strengths.push('Positive technical momentum supports price action');
  }
  if (analysis.grahamNumber?.isBelowGraham) {
    strengths.push('Trading below Graham Number - potential value opportunity');
  }
  if (analysis.upside > 0.2) {
    strengths.push(`Significant upside potential of ${upside}%`);
  }
  if (analysis.marginOfSafety > 0.2) {
    strengths.push(`Healthy margin of safety of ${marginOfSafety}%`);
  }

  // Default strengths if none found
  if (strengths.length === 0) {
    strengths.push('Established market presence');
  }

  // Analyze risks
  if (analysis.riskFactors && analysis.riskFactors.length > 0) {
    analysis.riskFactors.slice(0, 3).forEach((r: { description: string }) => risks.push(r.description));
  }
  if (analysis.upside < 0) {
    risks.push('Trading above fair value with limited upside');
  }
  if (analysis.marginOfSafety < 0) {
    risks.push('No margin of safety at current prices');
  }

  // Default risks if none found
  if (risks.length === 0) {
    risks.push('Market volatility may impact short-term performance');
  }

  return `## Investment Thesis
${thesis}

## Key Strengths
${strengths.slice(0, 3).map(s => `• ${s}`).join('\n')}

## Key Risks
${risks.slice(0, 3).map(r => `• ${r}`).join('\n')}

## Fair Value Assessment
Current Price: $${analysis.currentPrice?.toFixed(2)} | Fair Value: $${analysis.fairValue?.toFixed(2)}
The stock is ${analysis.upside >= 0 ? 'undervalued' : 'overvalued'} by ${Math.abs(Number(upside))}%.

## Action Recommendation
${action}

---
*This analysis is generated algorithmically and should not be considered financial advice.*`;
}
