/**
 * Privacy Policy Page
 */

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
                <p className="text-xs text-slate-400">Privacy Policy</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <p className="text-slate-300 text-lg">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300">
              Stock Valuator (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Service.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <div className="text-slate-300 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Stock symbols you search for</li>
                  <li>Account information (email, name) if you create an account</li>
                  <li>Watchlist preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Browser type and version</li>
                  <li>IP address (anonymized)</li>
                  <li>Device information</li>
                  <li>Usage patterns and analytics</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <div className="text-slate-300">
              <p className="mb-3">We use collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain the Service</li>
                <li>Improve user experience</li>
                <li>Process stock analysis requests</li>
                <li>Send service-related notifications (with consent)</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <div className="text-slate-300 space-y-3">
              <p>We implement appropriate technical and organizational security measures to protect your personal data, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit (HTTPS)</li>
                <li>Secure data storage practices</li>
                <li>Regular security assessments</li>
                <li>Limited access to personal data</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">5. Cookies</h2>
            <div className="text-slate-300 space-y-3">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remember your preferences (e.g., disclaimer acceptance)</li>
                <li>Analyze usage patterns</li>
                <li>Improve the Service</li>
              </ul>
              <p>You can control cookies through your browser settings. Disabling cookies may affect some functionality.</p>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">6. Third-Party Services</h2>
            <div className="text-slate-300 space-y-3">
              <p>We use third-party services that may collect data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Yahoo Finance:</strong> For stock data (subject to Yahoo&apos;s privacy policy)</li>
                <li><strong>Vercel:</strong> For hosting (subject to Vercel&apos;s privacy policy)</li>
                <li><strong>Analytics providers:</strong> For usage statistics</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
            <div className="text-slate-300 space-y-3">
              <p>Under applicable data protection laws (including India&apos;s Digital Personal Data Protection Act, 2023), you have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent</li>
                <li>Data portability</li>
                <li>Lodge a complaint with regulatory authorities</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p className="text-slate-300">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law. Search history may be retained for service improvement but is not linked to personal identifiers.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-slate-300">
              This Service is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-slate-300">
              We may update this Privacy Policy from time to time. We will notify users of significant changes by posting the new policy on this page with an updated date.
            </p>
          </section>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-slate-300">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us through the platform.
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
