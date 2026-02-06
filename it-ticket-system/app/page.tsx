import Link from 'next/link';
import { MessageSquare, Shield, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">IT Ticket System</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary btn-sm">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight">
              Enterprise IT Support
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
              A modern, multi-tenant helpdesk solution built for IT teams. 
              Streamline ticket management, improve response times, and deliver exceptional support.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary px-8 py-3 text-base">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-outline px-8 py-3 text-base">
                Sign In to Dashboard
              </Link>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 relative">
            <div className="bg-slate-900 rounded-xl p-2 shadow-2xl">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{12 + i * 3}</p>
                        <p className="text-sm text-slate-500">Tickets</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Ticket</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Status</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-2 px-4 text-sm text-slate-700">VPN connection issue</td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Open
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                High
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need for IT support
            </h2>
            <p className="mt-4 text-slate-600">
              Built for modern IT teams with enterprise-grade features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Role-Based Access
              </h3>
              <p className="text-slate-600">
                Owners, admins, agents, and requesters - each with appropriate permissions
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Multi-Tenancy
              </h3>
              <p className="text-slate-600">
                Complete data isolation between organizations with enterprise security
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Real-Time Updates
              </h3>
              <p className="text-slate-600">
                Live ticket updates and comments powered by Supabase Realtime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to transform your IT support?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Start your free 14-day trial today. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn bg-white text-primary hover:bg-slate-100 px-8 py-3">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">IT Ticket System</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} IT Ticket System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

