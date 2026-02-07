import Link from 'next/link';
import { MessageSquare, Shield, Users, Zap, ArrowRight, CheckCircle, FileText, Github, Mail } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">IT Ticket System</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-slate-600 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/login" className="text-sm text-slate-600 hover:text-primary transition-colors">
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
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-br from-amber-100/50 via-orange-50/30 to-yellow-50/50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-orange-100/40 via-amber-50/30 to-transparent rounded-full blur-3xl opacity-40" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-700">Open Source & Self-Hostable</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
              Enterprise IT Support
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Made Simple
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A modern, multi-tenant helpdesk solution built for IT teams. 
              Streamline ticket management, improve response times, and deliver exceptional support.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-outline px-8 py-3.5 text-base hover:bg-slate-50 transition-all duration-300">
                Sign In to Dashboard
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 relative animate-slide-up">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-slate-900 rounded-xl p-2 shadow-2xl shadow-slate-900/20">
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{12 + i * 3}</p>
                        <p className="text-sm text-slate-500">Tickets</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ticket</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { title: 'VPN connection issue', status: 'Open', priority: 'High', assignee: 'John D.' },
                          { title: 'Software installation request', status: 'In Progress', priority: 'Medium', assignee: 'Sarah M.' },
                          { title: 'Email not syncing', status: 'Pending', priority: 'Low', assignee: 'Mike R.' },
                        ].map((ticket, i) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-slate-700 font-medium">{ticket.title}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                ticket.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-green-100 text-green-700'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">{ticket.assignee}</td>
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
      <section id="features" className="py-24 bg-amber-50/50 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(217, 119, 6, 0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Everything you need for IT support
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Built for modern IT teams with enterprise-grade features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Role-Based Access
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Owners, admins, agents, and requesters - each with appropriate permissions and access controls
              </p>
            </div>

            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Multi-Tenancy
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Complete data isolation between organizations with enterprise-grade security and compliance
              </p>
            </div>

            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Real-Time Updates
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Live ticket updates and comments powered by Supabase Realtime technology
              </p>
            </div>
          </div>

          {/* Additional features row */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Knowledge Base
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Create and share articles to help users resolve common issues quickly
              </p>
            </div>

            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Analytics & Reports
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Track team performance with detailed reports on ticket resolution times
              </p>
            </div>

            <div className="card p-6 lg:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                SLA Management
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Set and monitor service level agreements to ensure timely responses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Built with Modern Technologies
            </h2>
            <p className="mt-4 text-slate-600">
              Powered by best-in-class open source tools
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-medium text-slate-700">Next.js</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-green-200 transition-colors">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="font-medium text-slate-700">Supabase</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-cyan-200 transition-colors">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 9.51c-1.23 0-2.08-.46-2.83-.95l-2.68 2.68c1.53 1.15 3.01 2.12 4.59 2.82.64.28 1.33.46 2.09.46.71 0 1.36-.15 1.95-.4.02-.01.04-.02.06-.03l-3.18-4.58zM9.5 9.51c.76 0 1.45-.18 2.09-.46 1.58-.7 3.06-1.67 4.59-2.82l-2.68-2.68c-.75.49-1.6.95-2.83.95l-1.17 1.55v3.46zM3.5 12c0-1.34.33-2.6.91-3.68l2.26 3.26c-.24.12-.52.22-.82.22-.43 0-.83-.1-1.18-.28l-1.17-1.52zM17.25 15.5c.3 0 .58-.1.82-.22l2.26-3.26c.58 1.08.91 2.34.91 3.68 0 .42-.11.82-.31 1.17l-3.68-1.37z"/>
                </svg>
              </div>
              <span className="font-medium text-slate-700">TypeScript</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
              <svg className="w-8 h-8 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="font-medium text-slate-700">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-orange-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-16 text-center border border-white/20">
            <h2 className="text-3xl lg:text-5xl font-bold text-white">
              Ready to transform your IT support?
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Start your free 14-day trial today. No credit card required. 
              Deploy on your own infrastructure or use our cloud hosting.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn bg-white text-indigo-600 hover:bg-slate-100 px-8 py-4 text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <p className="mt-8 text-sm text-white/60">
              Already have an account?{' '}
              <Link href="/login" className="text-white font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">IT Ticket System</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A modern, open-source helpdesk solution for IT teams of all sizes.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                <li><Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/guides" className="hover:text-white transition-colors">Guides</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            {/* Connect */}
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="mailto:support@example.com" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} IT Ticket System. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-slate-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

