/**
 * Terms of Service Page
 */

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Stock Valuator</h1>
                <p className="text-xs text-slate-400">Terms of Service</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <p className="text-slate-300 text-lg">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300">
              By accessing and using Stock Valuator (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-300">
              Stock Valuator is an educational and informational platform that provides stock analysis tools, valuation metrics, and financial data visualization. The Service is designed to help users understand financial concepts and analyze publicly available stock market data.
            </p>
          </section>

          <section className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/30">
            <h2 className="text-xl font-semibold text-amber-300 mb-4">3. NOT Investment Advice</h2>
            <div className="text-slate-300 space-y-3">
              <p><strong className="text-white">IMPORTANT:</strong> The information provided through this Service is for <strong>educational and informational purposes only</strong>.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>This Service does NOT provide investment advice, financial advice, trading advice, or any other form of professional financial guidance.</li>
                <li>All analysis, valuations, projections, and recommendations are automated calculations based on publicly available data and should NOT be used as the sole basis for any investment decision.</li>
                <li>We are NOT registered with SEBI (Securities and Exchange Board of India) as Investment Advisors or Research Analysts.</li>
                <li>Past performance is NOT indicative of future results.</li>
                <li>All investments carry risk, and you may lose some or all of your invested capital.</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">4. User Responsibilities</h2>
            <div className="text-slate-300 space-y-3">
              <p>As a user of this Service, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conduct your own research before making any investment decisions</li>
                <li>Consult with qualified, SEBI-registered financial advisors for personalized investment advice</li>
                <li>Understand that you are solely responsible for your investment decisions</li>
                <li>Not hold the Service or its operators liable for any financial losses</li>
                <li>Use the Service only for lawful purposes</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Accuracy</h2>
            <p className="text-slate-300">
              While we strive to provide accurate information, we do not guarantee the accuracy, completeness, or timeliness of any data presented. Financial data is sourced from third-party providers (including Yahoo Finance) and may contain errors, delays, or omissions. Users should verify all information independently before relying on it.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-300">
              To the maximum extent permitted by law, Stock Valuator and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service, including but not limited to financial losses from investment decisions.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-slate-300">
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the property of Stock Valuator and are protected by intellectual property laws.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">8. Modifications to Terms</h2>
            <p className="text-slate-300">
              We reserve the right to modify these Terms of Service at any time. Continued use of the Service after any changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">9. Governing Law</h2>
            <p className="text-slate-300">
              These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
            <p className="text-slate-300">
              If you have any questions about these Terms of Service, please contact us through the platform.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
